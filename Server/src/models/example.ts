export class Example {
    public uid : number;
    public name_ : string;
    public desc : string | null;

    public constructor(uid : number, name_ : string, desc : string | null = null) {
        this.uid = uid;
        this.name_ = name_;
        this.desc = desc;
    }
}