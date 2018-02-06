define([
    'knockout-plus',
    'kb_common/html',
    '../dialogs/copyObject',
    'css!./results.css'
], function (
    ko,
    html,
    CopyObjectComponent
) {
    'use strict';

    var t = html.tag,
        button = t('button'),
        div = t('div'),
        span = t('span'),
        a = t('a'),
        table = t('table'),
        tbody = t('tbody'),
        tr = t('tr'),
        td = t('td');

    var styles = html.makeStyles({
        component: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'scroll'
            }
        },
        body: {
            css: {
                flex: '1 1 auto',                
                display: 'flex',
                flexDirection: 'column'
            }
        },   
        row: {
            css: {
                flex: '1 1 auto',                
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
            }
        },
        resultsRow: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(200,200,200,0.5)',
                marginBottom: '15px'
            },
            modifiers: {
                active: {
                    backgroundColor: 'rgba(200,200,200,1)'
                }
            }
        },        
        rowCell: {
            css: {
                padding: '4px'
            }
        },
        detailHeader: {
            css: {
                borderBottom: '1px silver solid',
            },
            scopes: {
                active: {
                    borderBottom: '1px gray solid'
                }
            }
        },
        highlight: {
            backgroundColor: 'yellow',
            fontWeight: 'bold'
        },
        resultsTable: {
            css: {
                border: '1px silver solid',
                width: '100%',
                maxWidth: '100%'
            },
            scopes: {
                active: {
                    border: '1px gray solid'
                }
            },
            innerClasses: {
                td: {
                    padding: '4px'
                },
                'td:nth-child(1)': {
                    width: '30%'
                },
                'td:nth-child(2)': {
                    width: '70%',
                    wordBreak: 'break-word'
                }
            }
        }
    });        

    function viewModel(params) {
        // If this is not an Element, it was installed with a comment and 
        // the first node in the template can be found as the next sibling.
        
        var searchState = params.searchState;

        searchState.status.subscribe(function (newValue) {
            console.log('status', newValue);
        });

        // ACTIONS

        function doCopyObject(data) {
            params.overlayComponent({
                name: CopyObjectComponent.name(),
                viewModel: {
                    ref: data.matchClass.ref
                }
            });
        }

        function doToggleShowMatches(data, ev) {
            if (ev.originalEvent.altKey) {
                params.doToggleShowMatches(data.showMatches());
                return;
            }
            if (data.showMatches()) {
                data.showMatches(false);
                data.showDetails(false);
            } else {
                data.showMatches(true);
                data.showDetails(false);
            }
        }

        function doToggleShowDetails(data, ev) {
            if (ev.originalEvent.altKey) {
                params.doToggleShowDetails(data.showDetails());
                return;
            }
            if (data.showDetails()) {
                data.showMatches(false);
                data.showDetails(false);
            } else {
                data.showMatches(false);
                data.showDetails(true);
            }
        }
       
        function doNextPage() {
            
            params.doNextPage();
        }

        function doPreviousPage() {
            params.doPreviousPage();
        }

        function doToggleSelected(data) {
            console.log(data);
            data.selected(data.selected() ? false : true);
            // var selectedObjects = params.selectedObjects
            if (params.selectedObjects().indexOf(data.matchClass.ref.ref) >= 0) {
                params.selectedObjects.remove(data.matchClass.ref.ref);
            } else {
                params.selectedObjects.push(data.matchClass.ref.ref);
            }
        }

        function doMouseOverRow(data) {
            data.active(true);
        }

        function doMouseOutRow(data) {
            data.active(false);
        }

        // LIFECYCLE

        function dispose() {
        }

        function descendantsComplete() {
            console.log('completed?');
            // updateScroller();
        }

        return {
            searchState: searchState,

            // scroller: scroller,

            // ACTIONS
            doCopyObject: doCopyObject,

            doNextPage: doNextPage,
            doPreviousPage: doPreviousPage,

            doToggleSelected: doToggleSelected,

            doToggleShowMatches: doToggleShowMatches,
            doToggleShowDetails: doToggleShowDetails,

            doMouseOverRow: doMouseOverRow,
            doMouseOutRow: doMouseOutRow,

            // LIFECYCLE
            dispose: dispose,
            koDescendantsComplete: descendantsComplete
        };
    }

    function buildObjectButton() {
        return [
            '<!-- ko switch: matchClass.id -->',

            // '<!-- ko case: "narrative" -->',
            // button({
            //     class: 'btn btn-default'                
            // }, 'Duplicate...'),
            // '<!-- /ko -->',

            '<!-- ko case: "dataObject" -->',
            '<!-- ko if: matchClass.copyable -->',
            button({
                class: 'btn btn-default',
                dataBind: {
                    click: '$component.doCopyObject'
                }              
            }, 'Copy...'),
            '<!-- /ko -->',
            '<!-- /ko -->',

            '<!-- /ko -->'
        ];
    }

    function buildObjectCheckbox() {
        return [
            '<!-- ko switch: matchClass.id -->',

            // '<!-- ko case: "narrative" -->',
            // button({
            //     class: 'btn btn-default'                
            // }, 'Duplicate...'),
            // '<!-- /ko -->',

            '<!-- ko case: "dataObject" -->',
            '<!-- ko if: matchClass.copyable -->',

            '<!-- ko if: selected() -->',
            span({
                class: 'fa fa-check-square-o',
                style: {
                    fontSize: '120%',
                },
                dataBind: {
                    click: '$component.doToggleSelected'
                }
            }),
            '<!-- /ko -->',

            '<!-- ko ifnot: selected() -->',
            span({
                class: 'fa fa-square-o',
                style: {
                    fontSize: '120%',
                },
                dataBind: {
                    click: '$component.doToggleSelected'
                }
            }),
            '<!-- /ko -->',

            '<!-- /ko -->',
            '<!-- /ko -->',

            '<!-- /ko -->'
        ];
    }
    
    function buildObjectLink() {
        return [
            '<!-- ko switch: matchClass.id -->',

            '<!-- ko case: "dataObject" -->',
            '<!-- ko if: matchClass.viewable -->',
            a({
                dataBind: {
                    attr: {
                        href: '"#dataview/" + matchClass.ref.workspaceId + "/" + matchClass.ref.objectId + "/" + matchClass.ref.version'
                    },
                    text: 'name'
                }
            }),
            '<!-- /ko -->',
            '<!-- ko ifnot: matchClass.viewable -->',
            div({
                dataBind: {
                    text: 'name'
                }
            }),
            '<!-- /ko -->',
            '<!-- /ko -->',

            '<!-- /ko -->'
        ];
    }

    function buildObjectView() {
        return div({
            class: styles.classes.row
        }, [
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            }, buildObjectCheckbox()),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                },
                dataBind: {
                    text: 'type.label'
                }
            }),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '3'
                }
            }, buildObjectLink()),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1.5'
                }
            }, div({
                dataBind: {
                    text: 'scientificName'
                }
            })),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1.5'
                },
                dataBind: {
                    typedText: {
                        type: '"date"',
                        format: '"MM/DD/YYYY"',
                        value: 'date'
                    }
                }
            }),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            }, buildObjectButton()),
        ]);
    }

    function buildMatchHighlightsTable() {
        return table({
            class: styles.classes.resultsTable,
        }, tbody({
            dataBind: {
                foreach: 'matches'
            }
        }, tr([
            td({
                dataBind: {
                    text: 'label'
                }
            }),
            td({
            },[
                '<!-- ko foreach: $data.highlights -->',
                span({
                    dataBind: {
                        text: 'before'
                    }
                }),
                span({
                    dataBind: {
                        text: 'match'
                    },
                    class: styles.classes.highlight
                }),
                span({
                    dataBind: {
                        text: 'after'
                    }
                }),
                '<!-- /ko -->',
            ])
        ])));
    }

    function buildMatchViewMatches() {
        return div({
            class: styles.classes.row
        }, [
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            }),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            }),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '4.5'
                }
            }, buildMatchHighlightsTable()),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            }, ''),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            })
        ]);
    }

    function buildSummaryView() {
        return div({
            class: styles.classes.row
        }, [           
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '7.5'
                }
            }, div({
                class: styles.classes.rowCell,
                style: {
                    fontStyle: 'italic',
                    display: 'inline-block'
                }
            }, [
                'Show ',               
                button({
                    class: 'btn btn-default',
                    dataBind: {
                        click: '$component.doToggleShowMatches',
                        enable: 'active',
                        class: 'showMatches() ? "active" : null'
                    }
                }, 'matches'),
                button({
                    class: 'btn btn-default',
                    dataBind: {
                        click: '$component.doToggleShowDetails',
                        enable: 'active',
                        class: 'showDetails() ? "active" : null'
                    }
                }, 'detail'),
                // span({
                //     style: {
                //         marginLeft: '6px'
                //     }
                // }, 'Matched on '),
                // '<!-- ko foreach: summary -->',
                // span({
                //     style: {
                //         fontWeight: 'bold'
                //     },
                //     dataBind: {
                //         text: 'count'
                //     }
                // }), 
                // ' ',
                // span({
                //     dataBind: {
                //         labelText: {
                //             label: 'id',
                //             quantity: 'count',
                //             labels: '$root.labels'
                //         }
                //     }
                // }),
                // '<!-- ko if: $index() !== $parent.summary.length - 1 -->',
                // ', ',
                // '<!-- /ko -->',
                // '<!-- /ko -->',
            ])),
            div({                
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            })
        ]);
    }

    function buildMatchViewDetailTable() {
        return table({
            class: styles.classes.resultsTable,
        }, tbody({
            dataBind: {
                foreach: 'detail'
            }
        }, tr([
            td({
                dataBind: {
                    text: 'label'
                }
            }),
            '<!-- ko if: $data.highlights -->',
           
            td([
                '<!-- ko foreach: $data.highlights -->',
                span({
                    dataBind: {
                        text: 'before'
                    }
                }), ' ',
                span({
                    dataBind: {
                        text: 'match'
                    },
                    class: 'highlight'
                }), ' ', 
                span({
                    dataBind: {
                        text: 'after'
                    }
                }),
                '<!-- /ko -->',
            ]),
            
            '<!-- /ko -->',
            '<!-- ko ifnot: $data.highlights -->',

            '<!-- ko if: $data.type -->',
            td({
                dataBind: {
                    typedText: {
                        value: 'value',
                        type: 'type',
                        format: 'format'
                    }
                }
            }),
            '<!-- /ko -->',

            '<!-- ko if: $data.component -->',
            td({
                dataBind: {
                    component: {
                        name: '$data.component',
                        params: {
                            value: '$data.value'
                        }
                    }
                }
            }),
            '<!-- /ko -->',

            '<!-- ko ifnot: $data.type || $data.component -->',
            td({
                dataBind: {
                    text: 'value'
                }
            }),
            '<!-- /ko -->',

            '<!-- /ko -->'
        ])));
    }

    function buildMatchViewDetail() {
        return div({
            class: styles.classes.row
        }, [
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            }, ''),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            }),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '4.5'
                }
            }, buildMatchViewDetailTable()),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            }),
            div({
                class: styles.classes.rowCell,
                style: {
                    flex: '1'
                }
            }),
        ]);
    }

    function buildViewRow() {
        return div({
            class: styles.classes.body,
            style: {
                // marginTop: '5px',
                marginBottom: '15px'
            }
        }, [
            buildSummaryView(),
            '<!-- ko if: showMatches -->',
            buildMatchViewMatches(),
            '<!-- /ko -->',

            '<!-- ko if: showDetails -->',
            buildMatchViewDetail(),
            '<!-- /ko -->',
        ]);
    }

    function buildRow() {
        return div({
            class: styles.classes.resultsRow,
            dataBind: {
                event: {
                    mouseenter: '$component.doMouseOverRow',
                    mouseleave: '$component.doMouseOutRow'
                },
                class: 'active() ? "' + styles.scopes.active + '" : null',
            }
        }, [
            buildObjectView(),
            buildViewRow()
        ]);
    }

    function buildResults() {
        return div({
            dataBind: {
                foreach: 'searchState.buffer',
            },
            name: 'result-rows'
        }, [
            buildRow()
        ]);
    }

    function template() {
        return div({
            class: styles.classes.component
        }, [
            styles.sheet,            
            div({
                style: {
                    flex: '1 1 0px'
                },
                name: 'result-rows-container'
            }, buildResults())
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return ko.kb.registerComponent(component);
});