/* jshint evil: true */
/* global
    manipulationTestHelper,
    prepareUnitTestModule,
    test,
    expect,
    equal,
    IMG_SRC,
    deepEqual
*/
"use strict";

module("images", {setup: prepareUnitTestModule});

test("Inserts image into a paragraph", function () {
    manipulationTestHelper({
        startHtml: "<p>Foo</p>",
        setCaretInSelector: 'p',
        manipulationFunc: function (wymeditor) {
            wymeditor.insertImage({
                src: IMG_SRC,
                alt: "Example"
            });
        },
        expectedResultHtml: "<p><img alt=\"Example\" " +
            "src=\"" + IMG_SRC + "\" />Foo</p>",
        testUndoRedo: true
    });
});

test("Inserts image into the body", function () {
    manipulationTestHelper({
        startHtml: "<br />",
        prepareFunc: function (wymeditor) {
            wymeditor.setCaretIn(wymeditor.body());
        },
        manipulationFunc: function (wymeditor) {
            wymeditor.insertImage({
                alt: "Example",
                src: IMG_SRC
            });
        },
        expectedResultHtml: "<img alt=\"Example\" " +
            "src=\"" + IMG_SRC + "\" /><br />",
        testUndoRedo: true
    });
});

test("._selectedImage is saved on mousedown", function () {
    var initHtml = [""
        , '<p id="noimage">Images? We dont need no silly images</p>'
        , '<p>'
            , '<img id="google" src="' + IMG_SRC + '" />'
        , '</p>'
        ].join(''),
        wymeditor = jQuery.wymeditors(0),
        $body,
        $noimage,
        $google;

    expect(3);

    wymeditor.rawHtml(initHtml);
    $body = wymeditor.$body();

    // Editor starts with no selected image. Use equal instead of strictEqual
    // because wymeditor._selectedImage intermittently changes between being
    // undefined and null, but either value should be acceptable for this test.
    equal(
        wymeditor._selectedImage,
        null
    );

    // Clicking on a non-image doesn't change that
    $noimage = $body.find('#noimage');
    $noimage.mousedown();
    deepEqual(wymeditor._selectedImage, null);


    // Clicking an image does update the selected image
    $google = $body.find('#google');
    $google.mousedown();
    deepEqual(wymeditor._selectedImage, $google[0]);
});
