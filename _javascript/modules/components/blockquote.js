export function blockquote() {
document.addEventListener("DOMContentLoaded", function() {
  console.log('ㅜㅜ')
    const blockquotes = document.querySelectorAll('blockquote p:first-of-type');

    blockquotes.forEach(function(blockquote) {
      const text = blockquote.textContent;    
      console.log('!!')
      // 맨 앞 2글자와 맨 뒤 1글자를 잘라낸 후 표시
      if (text.startsWith("[!") && text.endsWith("]")) {
        console.log('???')
        blockquote.textContent = text.slice(2, -1);
      }
    });
  });
}