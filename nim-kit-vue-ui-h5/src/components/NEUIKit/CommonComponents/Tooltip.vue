<template>
  <div
    class="chat-tooltip"
    :style="{
      '--theme-bg-color': color,
    }"
  >
    <div
      class="chat_tooltip_content"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
      @touchmove="handleTouchMove"
    >
      <slot></slot>
      <div
        class="chat_tooltip__mask"
        v-show="isShow"
        @touchstart.stop="close"
      ></div>
      <div
        class="chat_tooltip__popper"
        @click.stop="() => {}"
        :style="[
          style,
          {
            visibility: isShow ? 'visible' : 'hidden',
            color: color === 'white' ? '' : '#fff',
            boxShadow:
              color === 'white'
                ? '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d'
                : '',
          },
        ]"
      >
        <slot name="content">{{ content }}</slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Tooltip",
  props: {
    visible: Boolean,
    align: Boolean,
    color: {
      type: String,
      default: "#303133",
    },
    // placement: {
    //   type: String,
    //   default: 'top',
    // },
    content: {
      type: String,
      default: "",
    },
    show: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      isShow: this.visible,
      title: "Hello",
      arrowLeft: 0,
      query: null,
      style: {},
      arrowStyle: {},
      placement: "top",
      touchTimer: null,
      touchStartTime: 0,
      touchStartPosition: null,
    };
  },
  onLoad() {},
  watch: {
    isShow: {
      handler(val) {
        this.$emit("update:visible", val);
      },
      immediate: true,
    },
    visible: {
      handler(val) {
        if (val) {
          this.$nextTick(() => {
            this.getPosition();
          });
        }
        this.isShow = val;
      },
      immediate: true,
    },
  },
  mounted() {
    // #ifdef H5
    window.addEventListener("click", () => {
      this.isShow = false;
    });
    // #endif
    this.getPosition();
  },
  methods: {
    close() {
      this.isShow = false;
    },
    fixedWrap() {
      this.isShow = false;
    },
    async handleClick() {
      if (this.isShow) {
        return (this.isShow = false);
      }
      await this.getPosition();
      this.isShow = true;
    },
    getPosition() {
      return new Promise((resolve) => {
        const tooltipContent = this.$el.querySelector(".chat_tooltip_content");
        const tooltipPopper = this.$el.querySelector(".chat_tooltip__popper");

        if (tooltipContent && tooltipPopper) {
          const contentRect = tooltipContent.getBoundingClientRect();
          const popperRect = tooltipPopper.getBoundingClientRect();
          const { top, width, height, left } = contentRect;
          const windowWidth = window.innerWidth;
          let objStyle = {};
          let objStyle1 = {};

          // 判断是否显示在顶部还是底部
          if (top <= 300) {
            this.placement = "bottom";
          } else {
            this.placement = "top";
          }

          switch (this.placement) {
            case "top":
              if (this.align) {
                // 计算左侧位置，确保不超出屏幕
                let leftPos = -100;
                if (width < 90) {
                  leftPos = -200;
                }
                // 检查是否会超出屏幕左侧
                if (left + leftPos < 0) {
                  leftPos = -left + 10; // 留10px边距
                }
                // 检查是否会超出屏幕右侧
                if (left + leftPos + popperRect.width > windowWidth) {
                  leftPos = windowWidth - left - popperRect.width - 10;
                }
                objStyle.left = `${leftPos}px`;
              } else {
                let leftPos = 50;
                // 检查是否会超出屏幕右侧
                if (left + leftPos + popperRect.width > windowWidth) {
                  leftPos = windowWidth - left - popperRect.width - 10;
                }
                objStyle.left = `${leftPos}px`;
              }
              objStyle.bottom = `${height + 8}px`;
              break;

            case "bottom":
              if (this.align) {
                let leftPos = -100;
                if (width < 100) {
                  leftPos = -200;
                }
                // 检查是否会超出屏幕左侧
                if (left + leftPos < 0) {
                  leftPos = -left + 10;
                }
                // 检查是否会超出屏幕右侧
                if (left + leftPos + popperRect.width > windowWidth) {
                  leftPos = windowWidth - left - popperRect.width - 10;
                }
                objStyle.left = `${leftPos}px`;
              } else {
                let leftPos = 50;
                // 检查是否会超出屏幕右侧
                if (left + leftPos + popperRect.width > windowWidth) {
                  leftPos = windowWidth - left - popperRect.width - 10;
                }
                objStyle.left = `${leftPos}px`;
              }
              objStyle.top = `${height + 8}px`;
              break;
          }

          this.style = objStyle;
          this.arrowStyle = objStyle1;
          resolve();
        }
      });
    },
    handleTouchStart(e) {
      this.touchStartTime = Date.now();
      this.touchStartPosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      this.touchTimer = setTimeout(() => {
        // 检查是否移动了太多
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const moveDistance = Math.sqrt(
          Math.pow(currentX - this.touchStartPosition.x, 2) +
            Math.pow(currentY - this.touchStartPosition.y, 2)
        );

        if (moveDistance < 10) {
          // 允许少量移动
          this.handleClick();
        }
      }, 500); // 长按时间阈值：500ms
    },

    handleTouchEnd() {
      clearTimeout(this.touchTimer);
    },

    handleTouchMove() {
      clearTimeout(this.touchTimer);
    },
  },

  beforeUnmount() {
    clearTimeout(this.touchTimer);
  },
};
</script>

<style scoped>
/* $theme-bg-color: var(--theme-bg-color);*/

.chat-tooltip {
  position: relative;
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -khtml-user-select: none; /* Konqueror HTML */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version */
  -webkit-tap-highlight-color: transparent; /* 移除触摸高亮效果 */
}

.chat_tooltip_content {
  height: 100%;
  position: relative;
  display: inline-block;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.chat_tooltip__popper {
  /* transform-origin: center top; */
  /* background: $theme-bg-color; */

  visibility: hidden;

  position: absolute;
  border-radius: 4px;
  font-size: 12px;
  padding: 10px;
  min-width: 10px;
  max-width: calc(100vw - 20px); /* 限制最大宽度，两边留10px边距 */
  overflow-wrap: break-word;  /* 允许长单词换行 */
  white-space: normal;  /* 允许文本换行 */
  display: inline-block;
  white-space: nowrap;
  z-index: 99;
  background-color: #fff;
}

.chat_tooltip__mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: rgba(256, 256, 256, 0);
  z-index: 8;
}

.chat_popper__icon {
  width: 0;
  height: 0;
  z-index: 9;
  position: absolute;
}

.chat_popper__arrow {
  bottom: -5px;
  /* transform-origin: center top; */
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  /* border-top: 6px solid $theme-bg-color;*/
}

.chat_popper__right {
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  /* border-right: 6px solid $theme-bg-color;*/
  left: -5px;
}

.chat_popper__left {
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  /* border-left: 6px solid $theme-bg-color;*/
  right: -5px;
}

.chat_popper__up {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  /*border-bottom: 6px solid $theme-bg-color;*/
  top: -5px;
}

.fixed {
  position: absolute;
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: auto;
  background: red;
  z-index: -1;
}
</style>
