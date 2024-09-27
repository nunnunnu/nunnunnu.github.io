document.addEventListener("DOMContentLoaded", function () {
  const blockquotes = document.querySelectorAll('blockquote');

  blockquotes.forEach(function (blockquote) {
    const firstParagraph = blockquote.querySelector('p:first-of-type')
    let text = firstParagraph.textContent
    let nextLine = ''
    var titleText = ''

    if (text.startsWith("[!")) {
      if (!text.endsWith("]")) {
        const texts = text.split(']');
        text = texts.shift();

        texts.forEach(element => {
          nextLine += element + ']';
        });
        titleText = text.slice(2);
      } else {
        titleText = text.slice(2, -1)
      }
      firstParagraph.innerHTML = `<strong style="color: var(--blockquote-title-color); font-size: 18px;">${titleText}</strong>`; // 제목 표시
      firstParagraph.innerHTML += `<p>${nextLine}</p>`;
    }
  });
});
