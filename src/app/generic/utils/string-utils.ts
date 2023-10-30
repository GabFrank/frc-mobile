export function comparatorLike(str1: string, str2: string) {
    let length = str1.length;
    let newStr: string = '';
    for (let index = 0; index < length; index++) {
        if (str1[index] != ' ') {
            newStr = newStr + str1[index] + '.*'
        }
    }
    return str2.match(new RegExp(newStr, 'i'));
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}
