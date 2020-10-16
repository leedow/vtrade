let test = async () => {
  return 1
}

let test2 = async () => {
  await test()
  return 11
}


async function go2() {
  let a = await test2()
  console.log(a)
  return a
}

go2()
