// ハンバーガーメニューの開閉処理
document.querySelector('.hamburger-menu').addEventListener('click', function () {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('show');
  console.log('ハンバーガーメニューがクリックされました');

  // ハンバーガーメニューを閉じる処理
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('show');
    });
  });
});
