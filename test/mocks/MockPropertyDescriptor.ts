class MockPropertyDescriptor implements PropertyDescriptor {

    value: any;

    setValue(value: any): PropertyDescriptor {
        this.value = () => Promise.resolve(value);
        return this;
    }
}

export { MockPropertyDescriptor };