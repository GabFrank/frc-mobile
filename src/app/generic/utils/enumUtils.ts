export function enumToArray(enumme): string[] {
    return Object.keys(enumme)
        .filter(StringIsNumber)
        .map(key => enumme[key]);
}

const StringIsNumber = value => isNaN(Number(value)) === false;

export function getEnumValueByValue(enumObj: any, value: string): any {
  const keys = Object.keys(enumObj).filter(k => enumObj[k] === value);
  return keys.length > 0 ? enumObj[keys[0] as keyof typeof enumObj] : undefined;
}

