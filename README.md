# MINI-REACT

## Summary
- 简易版React
- 实现核心API: `createElement`、`render`、`useState`
- 理解`fiber`树的更新过程
- 使用`requestIdleCallback`作为`scheduler`进行任务调度
- 实现简易`diff`
- 实现简易`hooks`

## Test
```shell
npm i
npm start
```

## fiber tree
```ascii
     +---------+
     |  root   |
     +-+----+--+
       |    ^
 child |    |
       v    |
     +-+----+--+
     |  node   |
     +-+-------+
       |    ^-------------+return
 child |                  |
       v                  |
     +-+-------+      +---+-----+
     |  node   +----->+  node   |
     +-+-------+      +---------+
       |    ^----------------------------+return
child  |                                 |
       v                                 |
     +-+-------+      +---------+     +--+------+
     |  node   +----->+  node   +---->+  node   |
     +---------+      +---------+     +---------+

               sibling           sibling
```

`fiber树`不是一颗严格的n叉树，每个fiber结点有三个重要的指针: `return`、`child`、`sibling`， 对fiber树的遍历采用`dfs算法`。
