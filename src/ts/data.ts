module manticore.data {
    export class Monster {
        public scale:string;
 
        constructor(public name:string, 
                    public level:number, 
                    public size:string,
                    public kind:string,
                    public attributes: Array<string>) { 
            if (kind === "mook") {
                this.scale = "mook";
            }
            else {
                this.scale = size;
            }                
        }

        public toString() {
            return this.name + "(level " + this.level + " " + this.kind + ")";
        }
    }

    // general purpose predicates
    export interface IPredicate<T> {
        (v:T): boolean;
    }

    export function anyPredicate<T>(preds:Array<(v:T)=>boolean>) {
        return (v:T) => {
            for (var i = 0, j = preds.length; i < j; i++) {
                if (preds[i](v)) return true;
            }
            return false;
        };
    }

    export function allPredicate<T>(preds:Array<(v:T)=>boolean>) {
        return (v:T) => {
            for (var i = 0, j = preds.length; i < j; i++) {
                if (!preds[i](v)) return false;
            }
            return true;
        };
    }
    
    // monster specific predicate functions
    export function sizePredicate(size:string) {
        return (m:Monster) => m.size === size;
    }

    export function kindPredicate(kind:string) {
        return (m:Monster) => m.kind === kind;
    }

    export function hasOneAttributePredicate(attributes:string[]) {
        return (m:Monster) => {
            var mattrs = m.attributes;
            for (var i = 0, j = attributes.length; i < j; i++) {
                if (mattrs.indexOf(attributes[i]) >= 0) return true;
            }
            return false;
        }
    }


    export function predicateForFilters(filters:{[index: string]:string[]}) {
        var predicates:Array<(m:data.Monster) => boolean> = [];

        for (var key in filters) if (filters.hasOwnProperty(key)) {
            var attributes = filters[key];
            if (attributes === null || attributes.length == 0) continue;

            if (key === "size") {
                predicates.push(data.anyPredicate<data.Monster>(
                    attributes.map(data.sizePredicate)
                ));
            } 
            else if (key === "kind") {
                predicates.push(data.anyPredicate<data.Monster>(
                    attributes.map(data.kindPredicate)
                ));
            }
            else if (key === "attributes") {
                predicates.push(data.hasOneAttributePredicate(attributes));
            }
            else {
                throw new Error("unknown filter type: " + key);
            }            
        }

        return allPredicate(predicates);
    }


    export interface Allocation {
        monster:Monster;
        num:number;
    }


    export interface Allocator {
        (partySize: number, partyLevel: number, monsters: Array<Monster>): Array<Array<Allocation>>;
    }

}