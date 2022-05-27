// // 引入React核心库
// import React from 'react';
// // 引入React DOM
// import ReactDOM from 'react-dom';

// 引入mini-react 
import MINIReact from './lib'

// 添加事件监听
function clickHandle(e){
    console.log(e);
}

const element = MINIReact.createElement(
    'div', {
        'title': 'hello',
        'id': 'sky',
        'onClick': clickHandle
    },
    'hellworld',
    MINIReact.createElement('a', {
        'href': '#'
    }, 'a标签'),
    MINIReact.createElement('input', {
    }, '哈哈'), 
);

console.log(element);

const container = document.getElementById('root');

// 渲染组件到页面
MINIReact.render(
    element,
    container
);