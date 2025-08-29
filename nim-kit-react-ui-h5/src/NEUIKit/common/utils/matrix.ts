/**
 * 计算表情矩阵
 * @param arr 表情数组
 * @param colNum 每行列数
 * @returns 矩阵数组
 */
export const calculateMatrix = <T>(arr: T[], colNum: number): T[][] => {
  if (colNum < 1) {
    throw Error('colNum cannot be smaller than 1')
  }
  const len = arr.length
  const rowNum = Math.ceil(len / colNum)
  let curIndex = 0
  let curRow = 0
  const res: T[][] = []
  while (curIndex <= len && curRow < rowNum) {
    res[curRow] = arr.slice(curIndex, curIndex + colNum)
    curIndex += colNum
    curRow++
  }
  return res
}
