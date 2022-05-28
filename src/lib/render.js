// 下一个任务单元
let nextUnitOfWork = null;
// fiber树
let wipRoot = null;
// 更新前的fiber树
let currentRoot = null;
// 删除的结点
let deletions = [];
let wipFiber = [];
let hooksIndex = 0;

/*
    fiber: {
        dom: 真实dom
        parent: 父节点指针
        child: 子节点指针
        sibling: 兄弟节点指针 (单向链表)
        props: {
            children: [] 子节点
        }
    }
*/

// diff 虚拟DOM
function reconcileChildren(wipFiber, elements){
    let index  = 0;
    let prevSibling = null;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

    while(index < elements.length || !!oldFiber){
        const childrenElement = elements[index];
        let newFiber = null;
        
        const sameType = oldFiber && childrenElement && oldFiber.type === childrenElement.type;

        // UPDATE
        if(sameType){
            newFiber = {
                type: oldFiber.type,
                props: childrenElement.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: 'UPDATE'
            }
        }

        // CREATE
        if(!sameType && childrenElement){
            newFiber = {
                type: childrenElement.type,
                props: childrenElement.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: 'PLACEMENT'
            }
        }

        // DELET
        if(!sameType && oldFiber){
            oldFiber.effectTag = 'DELETION';
            deletions.push(oldFiber);
        }
        
        if (index === 0) {
            wipFiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }

        if(oldFiber){
            oldFiber = oldFiber.sibling;
        }

        prevSibling = newFiber;

        index++;
    }


    // elements.forEach((childrenElement, index) => {
    //     let newFiber = null;

    //     // diff DOM
    //     const sameType = oldFiber && childrenElement && oldFiber.type === childrenElement.type;

    //     // UPDATE
    //     if(sameType){
    //         newFiber = {
    //             type: oldFiber.type,
    //             props: childrenElement.props,
    //             dom: oldFiber.dom,
    //             parent: wipFiber,
    //             alternate: oldFiber,
    //             effectTag: 'UPDATE'
    //         }
    //     }

    //     // CREATE
    //     if(!sameType && childrenElement){
    //         newFiber = {
    //             type: childrenElement.type,
    //             props: childrenElement.props,
    //             dom: null,
    //             parent: wipFiber,
    //             alternate: null,
    //             effectTag: 'PLACEMENT'
    //         }
    //     }

    //     // DELET
    //     if(!sameType && oldFiber){
    //         oldFiber.effectTag = 'DELETION';
    //         deletions.push(oldFiber);
    //     }
        
    //     if (index === 0) {
    //         wipFiber.child = newFiber;
    //     } else {
    //         prevSibling.sibling = newFiber;
    //     }

    //     oldFiber = oldFiber.sibling;

    //     prevSibling = newFiber;
    // });

}

export function useState(initial){
    const oldHook = wipFiber?.alternate?.hooks?.[hooksIndex];
    const hook  = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    }

    const actions = oldHook ? oldHook.queue : [];
    actions.forEach((action) => {
        hook.state = action;
    })

    const setState = action => {
        hook.queue.push(action);
        // 触发更新
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        };
        nextUnitOfWork = wipRoot;
        deletions = [];
    }
    wipFiber.hooks.push(hook);
    hooksIndex++;
    return [hook.state, setState];
}

// 函数组件
function updateFunctionComponent(fiber){
    wipFiber = fiber;
    wipFiber.hooks = [];
    hooksIndex = 0;
    const children = [fiber.type(fiber.props)]; // 运行函数获取子结点
    reconcileChildren(fiber, children);
}
// 类组件
function updateHostComponent(fiber){
    // 执行任务单元
    // 1. reactElement 转换为真实的dom
    if (!fiber.dom) {
        fiber.dom = createDOM(fiber);
    }

    // 这里造成缺陷2，改为一次性提交DOM
    // if (fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom);
    // }


    // 2. 为当前的fiber创建它子结点的fiber
    // parent children sibling   生成fiber树，逻辑比较绕
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements);
}

// 任务执行单元
function preforUnitOfWork(fiber) {

    // 支持函数组件
    const isFunctionComponent = fiber.type instanceof Function;
    if(isFunctionComponent){
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }

    // 3.返回下一个任务单元
    if (fiber.child) {
        // 3-1: 先返回孩子
        return fiber.child;
    }
    let nextFiber = fiber;
    while(nextFiber){
        if(nextFiber.sibling){
            // 3-2: 再返回兄弟
            return nextFiber.sibling;
        }

        // 3-3: 最后向上回溯
        nextFiber = nextFiber.parent;
    }
}

// 筛选出事件
const isEvent = key => key.startsWith('on');
// 过滤children属性
const isProperty = key => key !== 'children' && !isEvent(key);
// 筛选出要移除的属性
const isGone = (prev, next) => key => !(key in next);
// 挑选出新的属性
const isNew = (prev, next) => key => prev[key] != next[key];
// 真实dom 更新
function updateDOM(dom, prevProps, nextProps){
    // 移除旧监听事件
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key =>
            isGone(prevProps, nextProps)(key) || isNew(prevProps, nextProps)(key)
        )
        .forEach(name =>{
            const evenType = name.toLowerCase().substring(2);
            dom.removeEventListener(evenType, prevProps[name]);
        })


    // 移除不存在新props中的属性
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => dom[name] = '');
    
    // 新增属性
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => dom[name] = nextProps[name]);

    // 新增监听事件
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name =>{
            const evenType = name.toLowerCase().substring(2);
            dom.addEventListener(evenType, nextProps[name]);
        })
}

// 删除结点
function commitDeletion(fiber, domParent){
    if(fiber.dom){
        domParent.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child, domParent);
    }
}

// 渲染真实的DOM
function commitWork(fiber){
    if(!fiber) return;

    // const domParent = fiber.parent.dom;

    let domParentFiber = fiber.parent;
    while(!domParentFiber.dom){
        domParentFiber =  domParentFiber.parent;
    }

    const domParent = domParentFiber.dom;

    // domParent.appendChild(fiber.dom);
    // 优化3
    switch(fiber.effectTag){
        case 'PLACEMENT':
            !!fiber.dom && domParent.appendChild(fiber.dom);
            break;
        case 'UPDATE':
            !!fiber.dom && updateDOM(fiber.dom, fiber.alternate, fiber.props);
            break;
        case 'DELETION':
            // !!fiber.dom && domParent.removeChild(fiber.dom);
            commitDeletion(fiber, domParent);
            break;
        default:
            break;
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

// 更新fiber树
function commitRoot(){
    commitWork(wipRoot.child);

    // 优化3
    deletions.forEach(commitWork);
    currentRoot = wipRoot;

    wipRoot = null;
}

// 工作流
function workLoop(deadline) {
    let shouldYeild = true;
    while (nextUnitOfWork && shouldYeild) {
        nextUnitOfWork = preforUnitOfWork(nextUnitOfWork);
        shouldYeild = deadline.timeRemaining() > 1; // 得到浏览器当前帧剩余时间
        // debugger; // 缺陷2: 浏览器可能会看到部分的UI，需要优化
    }

    // 优化2: 针对权限2
    if(!nextUnitOfWork && wipRoot){
        commitRoot();
    }

    // 一直call
    requestIdleCallback(workLoop); 
    // react内部用自定义的scheduler实现空闲调度，原因：requestIdleCallback有缺陷，兼容性也不好
}

// 优化1: 针对缺陷1，采用浏览器空闲时call
requestIdleCallback(workLoop);

// 创建真实DOM
function createDOM(fiber) {
    const dom =
        fiber.type === 'TEXT_ELEMENT' ?
        document.createTextNode('') :
        document.createElement(fiber.type);

    // const isProperty = key => key !== 'children';

    // 循环添加prop至dom上
    // Object.keys(fiber.props)
    //     .filter(isProperty)
    //     .forEach(name => dom[name] = fiber.props[name])
    updateDOM(dom, {}, fiber.props);

    return dom;

    // 缺陷1:
    // 递归render子节点【优化点：dom层级可能很深，导致渲染线程卡顿！！！】
    // element.props.children.forEach(child => render(child, dom));
    // container.appendChild(dom);
}

// 核心API：渲染
export function render(element, container) {

    // 缺陷1
    // createDOM(element, container);

    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
}