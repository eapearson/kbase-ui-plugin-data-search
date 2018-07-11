define([
    'bluebird',
    'knockout-plus',
    'kb_common/html',
    'kb_common/utils',
    './navbar',
    './results',
    './data',
    '../../lib/searchJob',
    '../../lib/timer'
], function (
    Promise,
    ko,
    html,
    utils,
    NavbarComponent,
    ResultsComponent,
    Data,
    SearchJob,
    Timer
) {
    'use strict';

    const t = html.tag,
        div = t('div');

    const styles = html.makeStyles({
        main: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        toolbar: {
            flex: '0 0 50px',
            display: 'flex',
            flexDirection: 'column'
        },
        navbar: {
            flex: '0 0 50px',
            display: 'flex',
            flexDirection: 'column'
        },
        header: {
            flex: '0 0 40px',
            display: 'flex',
            flexDirection: 'column'
        },
        results: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        }
    });

    function SearchState(params) {
        var pageSize = ko.observable(20);

        // Paging
        var page = ko.observable();

        // OUTPUT
        var status = ko.observable('none');

        var errorMessage = ko.observable();
        var error = ko.observable();


        var searching = ko.observable(false);

        // holds search result items for display
        var buffer = ko.observableArray();

        var grouped = ko.observableArray();

        // position of first item in the buffer in the total search results space.
        // var firstItemPosition = ko.observable();

        // Is the total search results space truncated due to limitations of the back end?
        var isTruncated = ko.observable();

        // The total # of items (may be estimated) in the search results space.
        var totalSearchHits = ko.observable();

        var totalSearchSpace = ko.observable();

        // Summary by type
        // TODO: an array, or a map of observables...
        var summary = ko.observableArray();

        // var start = ko.observable();

        var totalPages = ko.pureComputed(function () {
            var totalItems = totalSearchHits();
            if (typeof totalItems !== 'number') {
                return;
            }
            return Math.ceil(totalItems / pageSize());
        });

        var withPrivateData = params.withPrivateData;
        var withPublicData = params.withPublicData;
        var withUserData = params.withUserData;
        var withReferenceData = params.withReferenceData;

        return {
            pageSize: pageSize,
            page: page,
            totalPages: totalPages,
            status: status,
            errorMessage: errorMessage,
            error: error,
            searching: searching,
            buffer: buffer,
            grouped: grouped,
            isTruncated: isTruncated,
            totalSearchHits: totalSearchHits,
            totalSearchSpace: totalSearchSpace,
            summary: summary,

            withUserData: withUserData,
            withReferenceData: withReferenceData,
            withPrivateData: withPrivateData,
            withPublicData: withPublicData
        };
    }

    function viewModel(params, componentInfo) {
        var context = ko.contextFor(componentInfo.element);
        var runtime = context['$root'].runtime;
        var types = context['$root'].types;
        var appBus = context['$root'].appBus;

        var subscriptions = ko.kb.SubscriptionManager.make();

        // the search view model...
        var searchState = SearchState({
            withPrivateData: params.withPrivateData,
            withPublicData: params.withPublicData,
            withUserData: params.withUserData,
            withReferenceData: params.withReferenceData
        });

        var data = Data.make({
            runtime: runtime,
            types: types,
            pageSize: searchState.pageSize(),
            maxBufferSize: 100,
            maxSearchItems: 10000
        });

        var currentSearch = SearchJob.make();

        var lastQuery = null;
        function runSearch(query) {
            if (utils.isEqual(query, lastQuery)) {
                console.warn('duplicate query suppressed?', query, lastQuery);
                return;
            }
            lastQuery = query;
            currentSearch.cancel();

            // ensure search is runnable
            if (!query.input) {
                searchState.status('none');
                searchState.buffer(null);
                searchState.isTruncated(null);
                searchState.totalSearchHits(null);
                searchState.summary.removeAll();
                searchState.totalSearchSpace(null);
                return;
            }

            var thisSearch = SearchJob.make();
            currentSearch = thisSearch;

            searchState.searching(true);
            searchState.status('searching');
            searchState.errorMessage(null);
            searchState.error(null);

            var timer = Timer.make();

            timer.start('search');

            var searchJob = Promise.try(function () {
                thisSearch.started();
            })
                .then(function () {
                    return data.search({
                        start: query.start,
                        terms: query.terms,
                        withUserData: query.withUserData,
                        withReferenceData: query.withReferenceData,
                        withPrivateData: query.withPrivateData,
                        withPublicData: query.withPublicData
                    });
                })
                .then(function (result) {
                    timer.stop('search');
                    timer.start('processing');
                    return result;
                })
                .then(function (result) {
                    if (thisSearch.isCanceled()) {
                        return;
                    }
                    if (result.items.length === 0) {
                        searchState.status('notfound');
                        searchState.isTruncated(false);
                        searchState.totalSearchHits(null);
                        searchState.summary.removeAll();
                        searchState.totalSearchSpace(null);
                        searchState.page(null);
                        return;
                    }

                    var selected = params.selectedObjects().reduce(function (set, ref) {
                        set[ref] = true;
                        return set;
                    }, {});

                    // TODO: we need an ES5
                    // TODO: working? what does this do?
                    result.items.forEach(function (object) {
                        if (selected[object.matchClass.ref.ref]) {
                            object.selected(true);
                        }
                    });

                    searchState.buffer(result.items);
                    searchState.grouped(result.grouped);
                    searchState.isTruncated(result.isTruncated);
                    searchState.totalSearchHits(result.summary.totalSearchHits);
                    // TODO: remove summary altogether
                    searchState.summary.removeAll();
                    // result.summary.totalByType.forEach(function (total) {
                    //     searchState.summary.push(total);
                    // });
                    // searchState.summary.sort(function (a, b) {
                    //     return b.count - a.count;
                    // });
                    searchState.totalSearchSpace(result.summary.totalSearchSpace);
                    searchState.status('success');

                    // if page not set yet (because initial search), set it.
                    if (!searchState.page()) {
                        if (result.items.length > 0) {
                            searchState.page(1);
                        }
                    }
                })
                .catch(function (err) {
                    searchState.status('error');
                    searchState.errorMessage(err.message);
                    searchState.error(err);
                    appBus.send('error', {
                        error: err
                    });
                })
                .finally(function () {
                    timer.stop('processing');
                    timer.log();
                    thisSearch.finished();
                    searchState.searching(false);
                });
            thisSearch.running(searchJob);
            return searchJob;
        }

        var searchQuery = ko.pureComputed(function () {
            var page = searchState.page();
            var start;
            if (page) {
                start = page - 1;
            } else {
                start = 0;
            }

            var terms = params.searchTerms();
            return {
                input: params.searchInput(),
                terms: terms.terms,
                start: start,
                pageSize: searchState.pageSize(),
                forced: params.forceSearch(),
                withUserData: searchState.withUserData(),
                withReferenceData: searchState.withReferenceData(),
                withPrivateData: searchState.withPrivateData(),
                withPublicData: searchState.withPublicData()
            };
        });

        subscriptions.add(searchQuery.subscribe(function (newValue) {
            runSearch(newValue);
        }));

        // // ACTIONS

        function doToggleShowMatches(currentlyShowing) {
            searchState.buffer().forEach(function (item) {
                if (currentlyShowing) {
                    item.showMatches(false);
                    item.showDetails(false);
                } else {
                    item.showMatches(true);
                    item.showDetails(false);
                }
            });
        }
        function doToggleShowDetails(currentlyShowing) {
            searchState.buffer().forEach(function (item) {
                if (currentlyShowing) {
                    item.showMatches(false);
                    item.showDetails(false);
                } else {
                    item.showMatches(false);
                    item.showDetails(true);
                }
            });
        }

        // MAIN

        runSearch(searchQuery());

        // LIFECYCLE

        function dispose() {
            if (currentSearch) {
                currentSearch.cancel();
            }
            subscriptions.dispose();
        }

        return {
            searchState: searchState,
            view: params.view,

            narrativesTotal: params.narrativesTotal,
            referenceDataTotal: params.referenceDataTotal,
            featuresTotal: params.featuresTotal,

            overlayComponent: params.overlayComponent,
            selectedObjects: params.selectedObjects,

            // ACTIONS
            doToggleShowMatches: doToggleShowMatches,
            doToggleShowDetails: doToggleShowDetails,

            // LIFECYCLE
            dispose: dispose
        };
    }

    function template() {
        return div({
            class: styles.classes.main,
            dataKBTesthookComponent: 'genome-features-main'
        }, [
            div({
                class: styles.classes.navbar
            }, ko.kb.komponent({
                name: NavbarComponent.name(),
                params: {
                    page: 'searchState.page',
                    totalPages: 'searchState.totalPages',

                    typeCounts: 'searchState.summary',
                    resultCount: 'searchState.totalSearchHits',
                    searchStatus: 'searchState.status',
                    searchSpaceCount: 'searchState.totalSearchSpace',

                    withUserData: 'searchState.withUserData',
                    withReferenceData: 'searchState.withReferenceData',

                    withPrivateData: 'searchState.withPrivateData',
                    withPublicData: 'searchState.withPublicData',
                }
            })),
            div({
                class: styles.classes.results
            },  ko.kb.komponent({
                name: ResultsComponent.name(),
                params: {
                    searchState: 'searchState',

                    narrativesTotal: 'narrativesTotal',
                    referenceDataTotal: 'referenceDataTotal',
                    featuresTotal: 'featuresTotal',

                    view: 'view',
                    overlayComponent: 'overlayComponent',
                    selectedObjects: 'selectedObjects',
                    doToggleShowMatches: 'doToggleShowMatches',
                    doToggleShowDetails: 'doToggleShowDetails'
                }
            }))
        ]);
    }

    function component() {
        return {
            viewModel: {
                createViewModel: viewModel
            },
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return ko.kb.registerComponent(component);
});