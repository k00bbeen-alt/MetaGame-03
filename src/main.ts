import './style.css';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing app root');

const title = document.createElement('h1');
title.textContent = 'MetaGame-03';
const status = document.createElement('p');
status.textContent = 'TypeScript 개발환경 준비 완료';
app.append(title, status);
