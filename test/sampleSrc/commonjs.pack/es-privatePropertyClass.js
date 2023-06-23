
// https://developer.mozilla.org/docs/Web/JavaScript/Reference/Classes/Private_class_fields

export class ClassWithPrivate {
  #privateField;
  #privateFieldWithInitializer = 42;

  constructor() {
    this.#privateField = 'Private Field';
  }

  #privateMethod() {
    console.log('Private Method');
  }

  getPrivateField() {
    return this.#privateField;
  }

  setPrivateField(value) {
    this.#privateField = value;
  }

  publicMethod() {
    console.log('Public Method');
    this.#privateMethod(); // 調用私有方法
  }

  static #privateStaticField;
  static #privateStaticFieldWithInitializer = 42;

  static #privateStaticMethod() {
    console.log('Private Static Method');
  }

  static getPrivateStaticField() {
    return this.#privateStaticField;
  }

  static setPrivateStaticField(value) {
    this.#privateStaticField = value;
  }

  static publicStaticMethod() {
    console.log('Public Static Method');
    this.#privateStaticMethod(); // 調用私有靜態方法
  }
}

export function useSample() {
  const instance = new ClassWithPrivate();

  console.log(instance.getPrivateField());
  // Output: 'Private Field'

  instance.setPrivateField('New Private Field');
  console.log(instance.getPrivateField());
  // Output: 'New Private Field'

  instance.publicMethod();
  // Output:
  // 'Public Method'
  // 'Private Method'

  console.log(ClassWithPrivate.getPrivateStaticField());
  // Output: undefined

  ClassWithPrivate.setPrivateStaticField('Static Private Field');
  console.log(ClassWithPrivate.getPrivateStaticField());
  // Output: 'Static Private Field'

  ClassWithPrivate.publicStaticMethod();
  // Output:
  // 'Public Static Method'
  // 'Private Static Method'
}

