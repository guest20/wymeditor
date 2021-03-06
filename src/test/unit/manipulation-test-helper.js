/* exported
    manipulationTestHelper
*/
/* global
    expect,
    wymEqual,
    QUnit,
    SKIP_THIS_TEST
*/
"use strict";
/**
 * manipulationTestHelper
 * ======================
 *
 * Helper for testing editor manipulations. Don't leave home without it.
 *
 * @param a An object, containing:
 *     `startHtml`
 *         HTML to start the test with. Required if `expectedStartHtml` is not
 *         used.
 *     `setCaretInSelector`
 *         Optional; jQuery selector for an element to set the caret in at the
 *         start of the test.
 *     `prepareFunc`
 *         Optional; A function to prepare the test. Receives one argument, the
 *         WYMeditor instance.
 *     `expectedStartHtml`
 *         The HTML that is expected to be the state of the document after the
 *         `prepareFunc` ran. If this is not provided, the value of `startHtml`
 *         will be used.
 *     `manipulationFunc`
 *         Optional; The manipulation function to be tested. Receives one
 *         argument, the WYMeditor instance.
 *     `manipulationClickSelector`
 *         Optional; A jQuery selector that will be used to select exactly
 *         one element, that will be `jQuery.fn.click()`ed.
 *         It is expected that this results in the manipulation, same as
 *         `manipulationFunc`.
 *     `testUndoRedo`
 *         Optional; Whether to test undo/redo on this manipulation.
 *     `expectedResultHtml`
 *         The HTML that is expected to be the state of the document after the
 *         `manipulationFunc` ran.
 *     `additionalAssertionsFunc`
 *         Optional; Additional assertions for after the `manipulationFunc`.
 *     `parseHtml`
 *         Optional; Passed on to `wymEqual` as `options.parseHtml`. Defaults
 *         to `false`.
 *     `skipFunc`
 *         Optional; A function that will be called before anything else, whose
 *         return value, if it equals the constant `SKIP_THIS_TEST`, means
 *         this helper will immediately return and a warning will be printed
 *         at the console.
 *         For example:
 *         ```
 *         function(wymeditor) {
 *             if (
 *                 jQuery.browser.name === "msie" &&
 *                 jQuery.browser.versionNumber === 7
 *             ) {
 *                 return SKIP_THIS_TEST;
 *             }
 *         }
 *         ```
 *         This example uses the `jquery.browser` plugin
 *         https://github.com/gabceb/jquery-browser-plugin
 *
 *     `manipulationFunc` and `manipulationClickSelector` are not exclusive
 *     of each other. The procedure will be performed once for each of them.
 */
/* jshint latedef: nofunc */
function manipulationTestHelper(a) {
    var executions = [],
        wymeditor,
        EXECUTE;

    if (skipThisTest() === true) {
        return;
    }

    wymeditor = jQuery.wymeditors(0);

    EXECUTE = {
        FUNCTION: "function",
        UI_CLICK: "UI click",
        NO_MANIPULATION: "no manipulation"
    };

    if (typeof a.manipulationFunc === "function") {
        executions.push(EXECUTE.FUNCTION);
    }

    if (
        typeof a.manipulationClickSelector === "string"
    ) {
        executions.push(EXECUTE.UI_CLICK);
    }

    if (executions.length === 0) {
        manipulateAndAssert(EXECUTE.NO_MANIPULATION);
    }

    while (executions.length > 0) {
        manipulateAndAssert(executions.pop());
    }

    function manipulateAndAssert(manipulationCause) {

        initialize();
        assertStartHtml();
        resetHistory();

        performManipulation(manipulationCause);
        assertResultHtml();
        additionalAssertions();

        if (a.testUndoRedo !== true) {
            return;
        }
        wymeditor.undoRedo.undo();
        assertStartHtml("Back to start HTML after undo");

        wymeditor.undoRedo.redo();
        assertResultHtml("Back to result HTML after redo");
        additionalAssertions();

        function initialize() {
            if (typeof a.startHtml === 'string') {
                wymeditor.rawHtml(a.startHtml);
            }
            if (typeof a.setCaretInSelector === 'string') {
                wymeditor.setCaretIn(
                    wymeditor.$body().find(a.setCaretInSelector)[0]
                );
            }
            if (typeof a.prepareFunc === 'function') {
                a.prepareFunc(wymeditor);
            }
        }

        function assertStartHtml(assertionString) {
            expect(expect() === null ? 1 : expect() + 1);
            wymEqual(
                wymeditor,
                a.expectedStartHtml || a.startHtml,
                {
                    assertionString: assertionString ? assertionString :
                        "Start HTML",
                    parseHtml: typeof a.parseHtml === 'undefined' ? false :
                        a.parseHtml
                }
            );
        }

        function resetHistory() {
            if (a.testUndoRedo === true) {
                wymeditor.undoRedo.reset();
            }
        }

        function performManipulation(manipulationCause) {
            var $clickElement;

            switch (manipulationCause) {
                case EXECUTE.FUNCTION:
                    a.manipulationFunc(wymeditor);
                    break;
                case EXECUTE.UI_CLICK:
                    $clickElement = jQuery(a.manipulationClickSelector);
                    if ($clickElement.length !== 1) {
                        throw "Expected one element";
                    }
                    $clickElement.click();
                    break;
                case EXECUTE.NO_MANIPULATION:
                    return;
                default:
                    throw "Expected a means of manipulation";
            }
        }

        function assertResultHtml(assertionString) {
            if (typeof a.expectedResultHtml === 'string') {
                expect(expect() + 1);
                wymEqual(
                    wymeditor,
                    a.expectedResultHtml,
                    {
                        assertionString: (assertionString ? assertionString :
                            "Result HTML") + " via " + manipulationCause,
                        parseHtml: typeof a.parseHtml === 'undefined' ? false :
                            a.parseHtml
                    }
                );
            }
        }

        function additionalAssertions() {
            if (typeof a.additionalAssertionsFunc === 'function') {
                a.additionalAssertionsFunc(wymeditor);
            }
        }
    }

    function skipThisTest() {
        if (typeof a.skipFunc === 'function') {
            if (a.skipFunc() === SKIP_THIS_TEST) {
                if (expect() === null) {
                    // `expect()` returns null when it wasn't called before in
                    // the current test. Tests fail when they make zero
                    // assertions without calling `expect(0)`. This doesn't
                    // prevent `expect` from being called again, later, in the
                    // case `manipulationTestHelper` is not the last operation
                    // in th test.
                    expect(0);
                }
                WYMeditor.console.warn(
                    "Assertions skipped in test \"" +
                    QUnit.config.current.testName + "\" from module \"" +
                    QUnit.config.currentModule + "\"."
                );
                return true;
            }
        }
    }
}
/* jshint latedef: true */
