/* jshint evil: true */
/* global -$ */
"use strict";

/* This file is the custom code for Trident 7 and newer. At the time of writing
 * this, it is only IE11.
 */

WYMeditor.WymClassTrident7 = function (wym) {
    var wymClassTrident7 =  this;
    wymClassTrident7._wym = wym;
    wymClassTrident7._class = "class";
};

jQuery.extend(
    WYMeditor.WymClassTrident7.prototype,
    WYMeditor.WymClassGecko.prototype
);

jQuery.copyPropsFromObjectToObject(
    WYMeditor.WymClassTridentPre7.prototype,
    WYMeditor.WymClassTrident7.prototype,
    [
        '_exec',
        '_keyup',
        '_wrapWithContainer'
    ]
);

// Some tests fail in what seems to be an edge case of selection corruption.
// This method makes those tests pass.
// It seems to be an issue with Rangy and IE11.
WYMeditor.WymClassTrident7.prototype.rawHtml = function (html) {
    var wym = this;

    if (typeof html === "string") {
        wym._doc.designMode = "off";
        wym.$body().html(html);
        if (wym._isDesignModeOn() !== true) {
            wym._enableDesignModeOnDocument();
        }
    } else {
        return wym.$body().html();
    }
    return false;
};
