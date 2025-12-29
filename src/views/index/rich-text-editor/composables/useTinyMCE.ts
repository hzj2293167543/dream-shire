import { ref } from 'vue';

export function useTinyMCE() {
  const articleContent = ref('<p>请输入内容...</p>');

  function saveContent() {
    console.log('保存内容:', articleContent.value);
    // 发送到服务器...
  }
  return {
    articleContent,
    saveContent
  };
}