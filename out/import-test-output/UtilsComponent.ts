import { Observable, of } from "rxjs";
import _ from "lodash";
import * as fs from "fs";

export class UtilsComponent {
    processData(data: any[]): Observable<string> {
        /* tscb:3 */ 
                return of(JSON.stringify(data));
              
    }
}
