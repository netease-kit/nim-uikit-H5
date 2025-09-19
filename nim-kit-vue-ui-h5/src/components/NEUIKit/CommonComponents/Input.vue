<template>
  <div
    class="input-wrapper"
    :style="inputWrapperStyle"
    :class="{ 'is-disabled': disabled }"
  >
    <input
      ref="inputRef"
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      :style="inputStyle"
      class="input"
      autocomplete="off"
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
import { ref, watch, nextTick } from "vue";
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
  inputWrapperStyle: {
    type: Object,
    default: () => ({}),
  },
  id: {
    type: String,
    default: "",
  },
  focus: {
    type: Boolean,
    default: false,
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

const inputRef = ref<HTMLInputElement>();

// 监听 focus prop 的变化
watch(
  () => props.focus,
  async (newFocus) => {
    if (newFocus && inputRef.value) {
      await nextTick();
      inputRef.value.focus();
    }
  },
  { immediate: true }
);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
  emit("input", event);
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
  if (event.key === "Enter" || event.keyCode === 13) {
    event.preventDefault();
    emit("confirm", props.modelValue);
  }
};

defineExpose({
  focus: () => {
    inputRef.value?.focus();
  },
  blur: () => {
    inputRef.value?.blur();
  },
  inputRef,
});
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
