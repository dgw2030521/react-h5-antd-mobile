// 是否JSON字符串
const IsJsonString = str => {
  if (typeof str === 'string') {
    try {
      const obj = JSON.parse(str);
      // 等于这个条件说明就是JSON字符串 会返回true
      if (typeof obj === 'object' && obj) {
        return true;
      }
      // 不是就返回false
      return false;
    } catch (e) {
      return false;
    }
  }
  return false;
};

export { IsJsonString };
