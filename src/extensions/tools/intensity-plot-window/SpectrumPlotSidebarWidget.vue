<template>
  <div class="container">
    <el-button
      type="primary"
      @click="openPlotWindow"
    >
      Show Sampled Intensity Plot
    </el-button>
  </div>
</template>

<script>
/**
 * spectrum-plot-sidebar-widget renders a button to open the intensity plot
 * floating window.
 */
export default {
  name: 'spectrum-plot-sidebar-widget',
  props: ['controller'],
  methods: {
    openPlotWindow() {
      this.controller.windowConfig.open = !this.controller.windowConfig.open;
      setTimeout(this.controller.redrawPlot.bind(this.controller), 50);
    }
  }
};
</script>

<style scoped>
</style>
