/** @jsxRuntime classic */

// // 引入React核心库
// import React from 'react';
// // 引入React DOM
// import ReactDOM from 'react-dom';

// 引入mini-react 
import MINIReact from './lib'

const container = document.getElementById('root');

/// 测试case1:
// 添加事件监听
// function clickHandle(e){
//     console.log(e);
// }
// const element = MINIReact.createElement(
//     'div', {
//         'title': 'hello',
//         'id': 'sky',
//         'onClick': clickHandle
//     },
//     'hellworld',
//     MINIReact.createElement('a', {
//         'href': '#'
//     }, 'a标签'),
//     MINIReact.createElement('input', {
//     }, '哈哈'), 
// );
// console.log(element);
// // 渲染组件到页面
// MINIReact.render(
//     element,
//     container
// );

/// 测试case2：
/** @jsx MINIReact.createElement */
function App(){
    const [number, setNumber] = MINIReact.useState(1);
    const [visible, setVisible] = MINIReact.useState(true);

    return (
        <div>
            <button onClick={()=>{
                setNumber(number+1);
                setVisible(!visible);
            }}>点我+1</button>
            <h1>{number}</h1>
            {visible? <h2>显示</h2>:null}
        </div>
    )
}

MINIReact.render(<App />, container);