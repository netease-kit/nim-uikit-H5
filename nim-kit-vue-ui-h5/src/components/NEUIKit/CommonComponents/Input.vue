<template>
  <div class="input-wrapper" :class="{ 'is-disabled': disabled }">
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      :style="inputStyle"
      class="input"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keypress="handleKeypress"
    />
    <span v-if="showClear && modelValue" class="clear-icon" @click="clearInput">
      ×
    </span>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  placeholder: {
    type: String,
    default: "请输入",
  },
  disabled: {
    type: Boolean,
    default: false,
  },

  maxlength: {
    type: Number,
    default: undefined,
  },
  showClear: {
    type: Boolean,
    default: false,
  },
  inputStyle: {
    type: Object,
    default: () => ({}),
  },
  id: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "update:modelValue",
  "focus",
  "blur",
  "clear",
  "confirm",
  "input",
]);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;

  emit("update:modelValue", target.value);
  emit("input", target.value);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

const clearInput = () => {
  emit("update:modelValue", "");
  emit("clear");
};

const handleKeypress = (event: KeyboardEvent) => {
  // 检测是否按下回车键（包括移动设备的发送键）
  if (event.key === "Enter" || event.keyCode === 13) {
    event.preventDefault(); // 阻止默认的换行行为
    emit("confirm", props.modelValue); // 触发发送事件
  }
};
</script>

<style scoped>
.input-wrapper {
  position: relative;
  display: inline-flex;
  width: 100%;
  align-items: center;
  font-size: 16px;
  padding-right: 10px;
}

.input {
  width: 100%;
  height: 36px;
  border: none;
  border-radius: 4px;
  transition: border-color 0.2s;
  outline: none;
  box-sizing: border-box;
  color: #000;
  font-size: 16px;
  padding-left: 5px;
  white-space: nowrap;
}

.input:focus {
  border-color: #409eff;
}

.input:hover {
  border-color: #c0c4cc;
}

.input::placeholder {
  color: #c0c4cc;
}

.is-disabled .input {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
  cursor: not-allowed;
}

.clear-icon {
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #c0c4cc;
  font-size: 16px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #c0c4cc;
  text-align: center;
  line-height: 13px;
}

.clear-icon:hover {
  color: #909399;
}
</style>
