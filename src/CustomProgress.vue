<template>
<a-progress
  type="circle"
  :percent="data.percent"
/>
</template>

<script>
import { Progress } from "ant-design-vue";

export default {
  props: ['data'],
  components: {
    AProgress: Progress
  }
}
</script>