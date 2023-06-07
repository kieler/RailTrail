import { appendFile, appendFileSync, writeFile, writeFileSync } from "fs";
import { compileFromFile} from "json-schema-to-typescript";

export class SchemaService {
    /**
     * InitRequest
     */
    public initRequest() {
        compileFromFile('InitRequest.json').then(ts =>  appendFileSync('../../models/api_types.ts', ts))
    }

    public execute() {
        writeFileSync('../../models/api_types.ts', "")
        this.initRequest()
    }
}