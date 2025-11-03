<template>
  <nav class="header">
    <div class="header-logo">
      <img class="header-logo-img" src="@/assets/imgs/logo.svg" alt="logo" />
      <span>dream shire</span>
    </div>
    <ul class="header-nav">
      <li><router-link to="/">首页</router-link></li>
      <li><router-link to="/rich-text-editor">富文本编辑器</router-link></li>
      <li><router-link to="/song-player">歌曲播放器</router-link></li>
    </ul>
  </nav>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
  .header {
    @include FSC;
    .header-logo {
      @include FCC;
      gap: 10px;
      width: 500px;
      height: 100px;
    }
    .header-nav {
      @include FCC;
      gap: 20px;
    }
  }
</style>
