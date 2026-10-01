/** Đọc một dòng từ bàn phím mà không hiện ký tự nào — như lệnh sudo. */
export function hoiAn(cauHoi: string): Promise<string> {
  const vao = process.stdin
  process.stdout.write(cauHoi)
  if (!vao.isTTY) {
    // Có ống dẫn vào (echo … | lệnh): đọc dòng đầu.
    return new Promise((xong) => {
      let du = ''
      vao.setEncoding('utf8')
      vao.on('data', (d: string) => (du += d))
      vao.on('end', () => xong(du.split(/\r?\n/)[0] ?? ''))
    })
  }
  return new Promise((xong) => {
    let kq = ''
    vao.setRawMode(true)
    vao.resume()
    vao.setEncoding('utf8')
    const nghe = (kyTu: string) => {
      for (const c of kyTu) {
        if (c === '\r' || c === '\n') {
          vao.setRawMode(false)
          vao.pause()
          vao.off('data', nghe)
          process.stdout.write('\n')
          return xong(kq)
        }
        if (c === '\u0003') process.exit(130) // Ctrl+C
        if (c === '\u007f' || c === '\b') kq = kq.slice(0, -1)
        else kq += c
      }
    }
    vao.on('data', nghe)
  })
}
