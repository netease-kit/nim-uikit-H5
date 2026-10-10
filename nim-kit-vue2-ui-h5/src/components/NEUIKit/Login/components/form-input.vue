<template>
  <div>
    <div :class="inputClass">
      <slot name="addonBefore" />
      <Input
        class="input"
        :type="type"
        :modelValue="value"
        :show-clear="allowClear"
        @input="handleInput"
        @blur="handleBlur"
        :placeholder="placeholder"
      />
      <slot name="addonAfter" />
    </div>
    <div v-if="inputError && rule" class="error-tips">{{ rule.message }}</div>
  </div>
</template>

<script>
import Input from "../../CommonComponents/Input.vue";
export default {
  name: "LoginFormInput",
  components: {
    Input,
  },
  props: {
    className: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "text",
    },
    value: {
      type: String,
      default: "",
    },
    placeholder: {
      type: String,
      default: "",
    },
    allowClear: {
      type: Boolean,
      default: false,
    },
    rule: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      inputFocus: false,
      inputError: false,
    };
  },
  computed: {
    inputClass() {
      return [
        this.className,
        "form-input-item",
        { focus: this.inputFocus, error: this.inputError },
      ];
    },
  },
  methods: {
    handleInput(event) {
      let inputValue = event && event.target ? event.target.value : event;
      if (this.type === "tel") {
        inputValue = inputValue.replace(/\D/g, "");
      }
      this.$emit("updateModelValue", inputValue);
    },
    handleBlur() {
      this.inputFocus = false;
      if (this.rule && this.rule.trigger === "blur") {
        this.inputError = !this.rule.reg.test(this.value || "");
      }
    },
    clearInput() {
      this.$emit("updateModelValue", null);
      this.inputFocus = true;
    },
  },
};
</script>

<style scoped>
.form-input-item {
  border-bottom: 1px solid #dcdfe5;
  padding: 10px 10px 5px 0px;
  display: flex;
  height: 44px;
  align-items: center;
}

.form-input-item.focus {
  border-color: #337eff;
}

.form-input-item.error {
  border-color: #f56c6c;
}

.input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #333;
}

.error-tips {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
}
</style>
