define([
    'knockout-plus',
    'kb_common/html',
    './dialogs/copyObjects'
], function(
    ko,
    html,
    CopyObjectComponent
) {
    'use strict';

    var t = html.tag,
        button = t('button'),
        div = t('div');

    function viewModel(params) {
        function doCopyObjects() {
            params.overlayComponent({
                name: CopyObjectComponent.name(),
                viewModel: {
                    objectsToCopy: params.selectedObjects
                }
            });
        }

        return { 
            doCopyObjects: doCopyObjects,
            selectedObjects: params.selectedObjects
        };
    }

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'row'
        }
    });

    function buildCopyButton() {
        return button({
            class: 'btn btn-default',
            dataBind: {
                click: '$component.doCopyObjects',
                enable: 'selectedObjects().length > 0'
            }
        }, 'Copy Selected...');
    }

    function template() {
        return div({
            // class: styles.classes.component
            style: {
                textAlign: 'center'
            }
        }, [
            // styles.sheet,
            div({
                // style: {
                //     flex: '1',
                //     display: 'flex',
                //     alignItems: 'center'
                // }
            }, buildCopyButton())
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