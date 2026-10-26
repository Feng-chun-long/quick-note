// 移动端导航
const links = document.querySelector('.nav-links');
document.querySelector('.nav-brand')?.addEventListener('click', () => {});

// 平滑滚动由 CSS scroll-behavior 处理
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) e.preventDefault() || target.scrollIntoView({ behavior: 'smooth' });
  });
});
