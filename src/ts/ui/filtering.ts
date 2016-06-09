/// <reference path="strings.ts" />
/// <reference path="dom.ts" />
/// <reference path="../common/data.ts" />
/// <reference path="common.ts" />
/// <reference path="selection.tsx" />

module manticore.ui {
    import _ = strings._;
    
    
    class PropertyFilterView {
        private el:HTMLElement;

        public onChanged: Event<void>;
        private filter: selection.AttributeFilter;

        constructor (parent: HTMLElement,
                     private name: string, 
                     private attributes:{toString:()=>string}[]) {
            this.onChanged = new Event<void>();

            this.createElements();
            
            this._appendTo(parent);
        } 
        
        public remove() {
            this.el.remove();
        }

        private _appendTo(parent:HTMLElement) {
            parent.appendChild(this.el);
        }

        public getSelectedAttributes():string[] {            
            var selected = Array.from<Node>(this.el.querySelectorAll("li > input:checked"))
                .map<string>((el:HTMLInputElement) => el.name)
           ;

           return selected;
        }

        public updateFilterCounts(filters:{[index: string]: number}) {
            this.filter.updateCounts(filters);
            //  Array.from<Node>(this.el.querySelectorAll("li"))
            //     .forEach((el:HTMLElement) => {
            //         if (el.classList.contains("clear-selection")) return;
            //         var name = (<HTMLInputElement>el.querySelector("input[type=checkbox]")).name;
            //         var count = filters[name] || 0;

            //         if (count > 0) {
            //             el.classList.add("viable");
            //         } 
            //         else { 
            //             el.classList.remove("viable");
            //         }
            //         (<HTMLElement> el.querySelector(".count")).textContent = count.toString();
            //     });
            
        }

        private changeOccured() {
            this.toggleClear();
            this.onChanged.trigger(null);
        }
        
        private toggleState(attribute:string) { 
            var checkbox = <HTMLInputElement> this.el.querySelector('input[type=checkbox][name="' + attribute + '"]');

            checkbox.checked = !checkbox.checked;

            this.changeOccured();
        }

        private toggleClear() {
            if (this.allChoices().filter(li => li.classList.contains("selected")).length > 0) {
                this.el.classList.add("active");
            }
            else {
                this.el.classList.remove("active");
            }
        }

        private allChoices():HTMLElement[] {
            return <HTMLElement[]>Array.from<Node>(this.el.querySelectorAll("li[data-name]"));
        }
        
        private clearAll() {
            var all = this.allChoices();
            all.forEach((li) => {
                li.classList.remove("selected");
            });

            this.changeOccured();
        }
        
        private createElements() {
            // var toggleClick = (e) => {
            //     var nodeName = e.target.nodeName.toLowerCase();
            //     if (nodeName === "li") {
            //         this.toggleState(e.target.getAttribute("data-name"));
            //     }
            //     else if (nodeName === "label" || nodeName === "span") {
            //         this.toggleState(e.target.parentNode.getAttribute("data-name"));
            //     }
            //     e.preventDefault();
            //     e.stopPropagation();
            // };

            // function checkbox(key: string) {
            //     return DOM.documentFragment(
            //         [DOM.input({"type": "checkbox", "name": key}),
            //          DOM.label({"for": key}, [DOM.text(_(key))])]
            //     );                
            // }
            
            // var ul = DOM.ul(
            //     {
            //         "class": "clearfix",

            //         onclick: toggleClick,
            //     },
            //     this.attributes.map(key => {
            //         var k = key.toString();
            //         return DOM.li({"data-name": k}, [
            //             checkbox(k),
            //             DOM.span({"class": "count"}, [])
            //         ]);
            //     })
            // );

            // var clickReset = (e) => {
            //     e.preventDefault();
            //     this.clearAll();
            //     e.stopPropagation();
            // };
            
            // var header = DOM.header(null, [
            //     DOM.h2(null, [
            //         DOM.text(_(this.name)),
            //         DOM.a({
            //             "class": "reset",
            //             "onclick": clickReset,
            //         }, [DOM.text(_("[reset]"))])
            //     ])
            // ]);

            
            this.el = DOM.div(null, []);
            const props = {name: this.name, attributes: this.attributes.map(a => a.toString())};
            // this.filter = new selection.AttributeFilter(props);
            // (<any>window).filter = this.filter;
            // ReactDOM.render(this.filter.render(), this.el);
            this.filter = selection.install(this.el, props);
        }
    }

    
    interface IFilterSource {
        onFilterChanged: Event<string>
        
        getFilters():{[index: string]: string[]};

        updateSelectedCount(count: number);
        updateFilterCounts(filters: any);
    }
    

    class FiltersView implements IFilterSource {
        private el:HTMLElement;
        private selectionCountEl:HTMLElement;
        private filtersContainer: HTMLElement;

        public onFilterChanged: Event<string> = new Event<string>();

        private sourcesView: PropertyFilterView;
        private sizeView: PropertyFilterView;
        private kindView: PropertyFilterView;
        private attributesView: PropertyFilterView;

        constructor(parent: HTMLElement, private bestiary:Atom<bestiary.Bestiary>) {           
            this.createElements();
            this.createSubViews(bestiary.get());

            this.setVisibility(false);
            
            this.bestiary.onChange.register(bestiary => this.catalogChanged(bestiary));
                        
            this._appendTo(parent);
        }

        private createSubViews(newCatalog: bestiary.Bestiary) {
            this.sourcesView = new PropertyFilterView(this.filtersContainer, "Sources", newCatalog.allSources());
            
            this.sizeView = new PropertyFilterView(this.filtersContainer, "Size", newCatalog.allSizes());
            this.kindView = new PropertyFilterView(this.filtersContainer, "Role", newCatalog.allKinds());
            this.attributesView = new PropertyFilterView(this.filtersContainer, "Tags", newCatalog.allAttributes().sort());

            this.sourcesView.onChanged.register(_ => this.onFilterChanged.trigger("source"));
            this.sizeView.onChanged.register(_ => this.onFilterChanged.trigger("size"));
            this.kindView.onChanged.register(_ => this.onFilterChanged.trigger("kind"));
            this.attributesView.onChanged.register(_ => this.onFilterChanged.trigger("attributes"));
        }

        private catalogChanged(newCatalog: bestiary.Bestiary) {
            this.sourcesView.remove();
            this.sizeView.remove();
            this.kindView.remove();
            this.attributesView.remove();
            
            this.createSubViews(newCatalog);   
        }
        
        public setVisibility(visible: boolean) {
            this.el.style.display = visible ? "block" : "none";  
        }

        public getFilters():{[index: string]: string[]} {
            return {
                sources: this.sourcesView.getSelectedAttributes(),
                size: this.sizeView.getSelectedAttributes(),
                kind: this.kindView.getSelectedAttributes(),
                attributes: this.attributesView.getSelectedAttributes(),
            }
        }

        public updateFilterCounts(filters:any) {
            this.sourcesView.updateFilterCounts(filters.sources);
            this.sizeView.updateFilterCounts(filters.sizes);
            this.kindView.updateFilterCounts(filters.kinds);
            this.attributesView.updateFilterCounts(filters.attributes);
        }
        
        public updateSelectedCount(count: number) {
            this.selectionCountEl.textContent = _("Number selected ") + count;
        }

        private _appendTo(element:HTMLElement) {
            element.appendChild(this.el);
        }

        private createElements() {
            this.el = DOM.div(
                {
                    "class": "filters clearfix"
                }, 
                [
                    DOM.header( 
                        null, 
                        [
                            DOM.p(null, [DOM.text(_("[filter summary]"))])
                        ]
                    )
                ]
            );

            this.filtersContainer = DOM.div({});
            this.el.appendChild(this.filtersContainer);

            this.selectionCountEl = DOM.div({"class": "selection-count"});

            this.el.appendChild(this.selectionCountEl)
        }
    }



    class MonsterPickerView implements IFilterSource {
        private el: HTMLElement;

        public onFilterChanged: Event<string> = new Event<string>();

        private byNameView: PropertyFilterView;
        
        constructor (parent: HTMLElement, private catalog: Atom<bestiary.Bestiary>) {           
            this.createElements();
                        
            this.createSubViews(catalog.get());
            this.catalog.onChange.register(bestiary => this.catalogChanged(bestiary));
            
            this.setVisibility(false);
            
            this._appendTo(parent);
        }
        
        private createSubViews(newCatalog: bestiary.Bestiary) {
            this.byNameView = new PropertyFilterView(this.el, "By Name", newCatalog.allNames().sort());

            this.byNameView.onChanged.register(_ => this.onFilterChanged.trigger("names"));
        }

        private catalogChanged(newCatalog: bestiary.Bestiary) {
            this.byNameView.remove();
            
            this.createSubViews(newCatalog);   
        }
        

        public setVisibility(visible: boolean) {
            this.el.style.display = visible ? "block" : "none";  
        }
        
        public getFilters():{[index: string]: string[]} {
            return {
                name: this.byNameView.getSelectedAttributes()
            }; 
        }

        public updateSelectedCount(count: number) {
            
        }

        public updateFilterCounts(filters: any) {
            this.byNameView.updateFilterCounts(filters.names);
        }
        
        private createElements() {
            this.el = DOM.div(
                {
                    "class": "filters clearfix",                
                },
                [
                    DOM.header(
                        null,
                        [
                            DOM.p(null, [DOM.text(_("[pick monsters]"))])
                        ]
                    )
                ]
            );
        }
        
        private _appendTo(html:HTMLElement) {
            html.appendChild(this.el);
        }
    }
    

    // SelectionView wraps up the various methods of selecting monsters
    export class SelectionView implements IFilterSource {
        private el: HTMLElement;
        private filtersView: FiltersView;
        private pickersView: MonsterPickerView;

        public onFilterChanged: Event<string> = new Event<string>();

        private static filtersMode = {
            "class": "filters",
            
            display: (view: SelectionView) => {
                view.showChildView(true);
            },

            getFilters: (view: SelectionView) => view.filtersView.getFilters()
        };

        private static pickersMode = {
            "class": "picker",
            
            display: (view: SelectionView) => {
                view.showChildView(false);
            },

            getFilters: (view: SelectionView) => view.pickersView.getFilters()
        };

        private mode;
        
        constructor (private parent: HTMLElement, catalog: Atom<bestiary.Bestiary>) {                      
            this.createElements();
            
            this.filtersView = new FiltersView(this.el, catalog);
            this.pickersView = new MonsterPickerView(this.el, catalog);

            this.filtersView.onFilterChanged.register(v => this.onFilterChanged.trigger(v));
            this.pickersView.onFilterChanged.register(v => this.onFilterChanged.trigger(v));

            this.setMode(SelectionView.filtersMode);
            
            this._appendTo(parent);
        }         
        
        private _appendTo(element:HTMLElement) {
            element.appendChild(this.el);
        }

        public getFilters() {
            return this.mode.getFilters(this);
        }

        public updateSelectedCount(count: number) {
            this.filtersView.updateSelectedCount(count);
            this.pickersView.updateSelectedCount(count);
        }

        public updateFilterCounts(filters: any) {
            this.filtersView.updateFilterCounts(filters);
            this.pickersView.updateFilterCounts(filters);
        }

        private setMode(mode) {
            this.mode = mode;
            mode.display(this);
            
            Array.from(this.el.querySelectorAll("a.mode-switch")).forEach(el => (<HTMLElement>el).classList.remove("-active"));
            var active = (<HTMLElement>this.el.querySelector("a.mode-switch.-" + this.mode["class"]));
            if (active) active.classList.add("-active");

            this.onFilterChanged.trigger("");
        }
        
        private showChildView(filtersVisible: boolean) {
            this.filtersView.setVisibility(filtersVisible);
            this.pickersView.setVisibility(!filtersVisible);
        }
        
        private createElements() {
            var filtersMode = (e) => {
                this.setMode(SelectionView.filtersMode);
                e.preventDefault();
                e.stopPropagation();
            };

            var pickerMode = (e) => {
                this.setMode(SelectionView.pickersMode);
                e.preventDefault();
                e.stopPropagation();
            };
            
            this.el = ui.sectionMarkup("Filter monsters", "selection", "[select monsters]",
                [
                    DOM.div(
                        null,
                        [ DOM.p(null, [
                            DOM.text(_("[selection mode]")),
                            DOM.text(" "),
                            DOM.a({
                                "class": "mode-switch -filters",
                                onclick: filtersMode,
//                                ontouchend: filtersMode
                            }, [
                                DOM.text(_("[use filters]"))
                            ]),
                            DOM.text(" "),
                            DOM.a({
                                "class": "mode-switch -picker",
                                onclick: pickerMode,
//                                ontouchend: pickerMode
                            }, [
                                DOM.text(_("[use pickers]"))
                            ])]),                          
                        ]
                    )
                ]
            );
        }
    }
}