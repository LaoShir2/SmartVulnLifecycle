<template>
  <div id="app">
    <router-view /> <!-- 所有页面（Landing/VulnLayout）都在这里加载 -->
  </div>
</template>

<style>
/* 全局样式：重置默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Microsoft YaHei", sans-serif;
}
#app {
  width: 100%;
  height: 100vh;
}
/* 全局复用样式 */
.mono { font-family: Consolas, Monaco, monospace; }
.severity {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
.severity.HIGH { background: #ef4444; color: white; }
.severity.MEDIUM { background: #f59e0b; color: white; }
.severity.LOW { background: #10b981; color: white; }
.chip {
  display: inline-block;
  padding: 2px 6px;
  background: #1e293b;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}
</style>