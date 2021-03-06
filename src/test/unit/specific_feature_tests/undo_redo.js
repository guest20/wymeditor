/* jshint evil: true */
/* global
    wymEqual,
    prepareUnitTestModule,
    makeTextSelection,
    makeSelection,
    expect,
    equal,
    manipulationTestHelper,
    test
*/
"use strict";

module("undo_redo", {setup: prepareUnitTestModule});

test("Insert ordered list", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: "<p>Foo</p>",
        setCaretInSelector: "p",
        manipulationFunc: function (wymeditor) {
            wymeditor.exec("InsertOrderedList");
        },
        expectedResultHtml: "<ol><li>Foo</li></ol>"
    });
});

test("Insert unordered list", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: "<p>Foo</p>",
        setCaretInSelector: "p",
        manipulationFunc: function (wymeditor) {
            wymeditor.exec("InsertUnorderedList");
        },
        expectedResultHtml: "<ul><li>Foo</li></ul>"
    });
});

test("List; indent", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: "<ol><li>Foo</li></ol>",
        setCaretInSelector: "li",
        manipulationFunc: function (wymeditor) {
            wymeditor.exec("Indent");
        },
        expectedResultHtml:
            "<ol><li class=\"spacer_li\"><ol><li>Foo</li></ol></li></ol>"
    });
});

test("List; outdent", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: [""
            , "<ol>"
                , "<li class=\"spacer_li\">"
                    , "<ol>"
                        , "<li>Foo</li>"
                    , "</ol>"
                , "</li>"
            , "</ol>"
        ].join(""),
        setCaretInSelector: "li li",
        manipulationFunc: function (wymeditor) {
            wymeditor.exec("Outdent");
        },
        expectedResultHtml:
            "<ol><li>Foo</li></ol>"
    });
});

test("Insert table", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: "<br />",
        prepareFunc: function (wymeditor) {
            wymeditor.setCaretIn(wymeditor.body());
        },
        manipulationFunc: function (wymeditor) {
            wymeditor.insertTable(1, 1, "foo", "bar");
        },
        expectedResultHtml: [""
            , "<br />"
            , "<table summary=\"bar\">"
                , "<caption>foo</caption>"
                , "<tbody>"
                    , "<tr>"
                        , "<td></td>"
                    , "</tr>"
                , "</tbody>"
            , "</table>"
            , "<br class=\"wym-blocking-element-spacer wym-editor-only\" />"
        ].join("")
    });
});

test("`editor.paste`", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: "<br />",
        prepareFunc: function (wymeditor) {
            wymeditor.setCaretIn(wymeditor.body());
        },
        manipulationFunc: function (wymeditor) {
            wymeditor.paste("Foo");
        },
        expectedResultHtml: "<br /><p>Foo</p>"
    });
});

var DAWN_OF_HISTORY = "<h1>Dawn of History</h1>";

test("No going back before dawn of history", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: DAWN_OF_HISTORY,
        manipulationFunc: function () {},
        additionalAssertionsFunc: function (wymeditor) {
            expect(expect() + 1);
            wymEqual(wymeditor, DAWN_OF_HISTORY);
        },
        expectedResultHtml: DAWN_OF_HISTORY
    });
});

test("Restores selection", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: "<p>Foo</p><p>Bar</p>",
        prepareFunc: function (wymeditor) {
            makeTextSelection(
                wymeditor,
                wymeditor.$body().children("p")[0],
                wymeditor.$body().children("p")[1],
                0,
                3
            );
        },
        manipulationFunc: function () {},
        additionalAssertionsFunc: function (wymeditor) {
            expect(expect() + 1);
            equal(
                wymeditor.selection().toString(),
                "FooBar"
            );
        },
        expectedResultHtml: "<p>Foo</p><p>Bar</p>"
    });
});

test("Redo when everything has been redone", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: "<p>Foo</p>",
        prepareFunc: function (wymeditor) {
            wymeditor.undoRedo.reset();
        },
        manipulationFunc: function (wymeditor) {
            expect(expect() + 3);
            wymeditor.$body().append("<p>Bar</p>");
            wymeditor.registerModification();
            wymEqual(
                wymeditor,
                "<p>Foo</p><p>Bar</p>",
                {
                    assertionString: "Performed and registered a change."
                }
            );

            wymeditor.undoRedo.undo();
            wymEqual(
                wymeditor,
                "<p>Foo</p>",
                {
                    assertionString: "Undid change."
                }
            );

            wymeditor.undoRedo.redo();
            wymEqual(
                wymeditor,
                "<p>Foo</p><p>Bar</p>",
                {
                    assertionString: "Redid change."
                }
            );

            wymeditor.undoRedo.redo();
        },
        // There are no more changes to redo.
        expectedResultHtml: "<p>Foo</p><p>Bar</p>"
    });
});

test("Toolbar buttons", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: "<p>Foo</p>",
        prepareFunc: function (wymeditor) {
            wymeditor.undoRedo.reset();
        },
        manipulationFunc: function (wymeditor) {
            expect(expect() + 3);
            var $buttons = wymeditor.get$Buttons(),
                $undoButton = $buttons.filter("[name=Undo]"),
                $redoButton = $buttons.filter("[name=Redo]");

            wymeditor.$body().append("<p>Bar</p>");
            wymeditor.registerModification();
            wymEqual(
                wymeditor,
                "<p>Foo</p><p>Bar</p>",
                {
                    assertionString: "Made change and registered it."
                }
            );

            $undoButton.click();
            wymEqual(
                wymeditor,
                "<p>Foo</p>",
                {
                    assertionString: "Undo by button click."
                }
            );

            $redoButton.click();
            wymEqual(
                wymeditor,
                "<p>Foo</p><p>Bar</p>",
                {
                    assertionString: "Redo by button click."
                }
            );
        }
    });
});

test("Nothing to redo after change", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: "<p>Foo</p>",
        prepareFunc: function (wymeditor) {
            wymeditor.undoRedo.reset();
        },
        manipulationFunc: function (wymeditor) {
            expect(expect() + 2);

            wymeditor.$body().append("<p>Bar</p>");
            wymeditor.registerModification();
            wymEqual(
                wymeditor,
                "<p>Foo</p><p>Bar</p>",
                {
                    assertionString: "Made change and registered it."
                }
            );

            wymeditor.undoRedo.undo();
            wymEqual(
                wymeditor,
                "<p>Foo</p>",
                {
                    assertionString: "Undid."
                }
            );

            wymeditor.$body().append("<p>Zad</p>");
            wymeditor.registerModification();
            wymeditor.undoRedo.redo();
        },
        // Nothing was redone.
        expectedResultHtml: "<p>Foo</p><p>Zad</p>"
    });
});

test("Table; merge cells", function () {
    manipulationTestHelper({
        testUndoRedo: true,
        startHtml: [""
            , "<br class=\"wym-blocking-element-spacer wym-editor-only\" />"
            , "<table>"
                , "<tbody>"
                    , "<tr><td>Foo</td><td>Bar</td></tr>"
                , "</tbody>"
            , "</table>"
            , "<br class=\"wym-blocking-element-spacer wym-editor-only\" />"
        ].join(''),
        prepareFunc: function (wymeditor) {
            var $cells = wymeditor.$body().find('td');
            makeSelection(
                wymeditor,
                $cells[0],
                $cells[1]
            );
        },
        manipulationFunc: function (wymeditor) {
            wymeditor.tableEditor.mergeRow(wymeditor.selection());
        },
        expectedResultHtml: [""
            , "<br class=\"wym-blocking-element-spacer wym-editor-only\" />"
            , "<table>"
                , "<tbody>"
                    , "<tr><td colspan=\"2\">FooBar</td></tr>"
                , "</tbody>"
            , "</table>"
            , "<br class=\"wym-blocking-element-spacer wym-editor-only\" />"
        ].join('')
    });
});
