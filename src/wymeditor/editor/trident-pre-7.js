/*jslint evil: true */
/* global rangy, -$ */
"use strict";

WYMeditor.WymClassTridentPre7 = function (wym) {
    var wymClassTridentPre7 = this;
    wymClassTridentPre7._wym = wym;
    wymClassTridentPre7._class = "className";
};

WYMeditor.WymClassTridentPre7.prototype._onEditorIframeLoad = function (wym) {
    wym._assignWymDoc();

    if (wym._isDesignModeOn() === false) {
        wym._doc.designMode = "On";
    } else {
        // Pre-7 Trident Internet Explorer versions reload the Iframe when its
        // designMode property is set to "on". So this will run on the second
        // time this handler is called.
        wym._afterDesignModeOn();
    }
};

WYMeditor.WymClassTridentPre7.prototype._assignWymDoc = function () {
    var wym = this;

    wym._doc = wym._iframe.contentWindow.document;
};

WYMeditor.WymClassTridentPre7.prototype._docEventQuirks = function () {
    var wym = this;

    wym._doc.onbeforedeactivate = function () {
        wym._saveCaret();
    };
    jQuery(wym._doc).bind('keyup', function (evt) {
        wym._keyup(evt);
    });
    wym._doc.onkeyup = function () {
        wym._saveCaret();
    };
    wym._doc.onclick = function () {
        wym._saveCaret();
    };

    wym._doc.body.onbeforepaste = function () {
        wym._iframe.contentWindow.event.returnValue = false;
    };

    wym._doc.body.onpaste = function () {
        wym._iframe.contentWindow.event.returnValue = false;
        wym.paste(window.clipboardData.getData("Text"));
    };
};

WYMeditor.WymClassTridentPre7.prototype._setButtonsUnselectable = function () {
    // Mark UI buttons as unselectable (#203)
    // Issue explained here:
    // http://stackoverflow.com/questions/1470932
    var wym = this,
        $buttons = wym.get$Buttons();

    $buttons.attr('unselectable', 'on');
};

WYMeditor.WymClassTridentPre7.prototype._uiQuirks = function () {
    var wym = this;
    if (jQuery.browser.versionNumber === 8) {
        wym._setButtonsUnselectable();
    }
};

WYMeditor.WymClassTridentPre7.prototype._saveCaret = function () {
    var wym = this,
        nativeSelection = wym._doc.selection;

    if (nativeSelection.type === "None") {
        return;
    }
    wym._doc.caretPos = nativeSelection.createRange();
};

WYMeditor.WymClassTridentPre7.prototype.insert = function (html) {
    var wym = this,
        // Get the current selection
        range = wym._doc.selection.createRange(),
        $selectionParents;

    // Check if the current selection is inside the editor
    $selectionParents = jQuery(range.parentElement()).parents();
    if ($selectionParents.is(wym._options.iframeBodySelector)) {
        try {
            // Overwrite selection with provided html
            range.pasteHTML(html);
        } catch (e) {}
    } else {
        // Fall back to the internal paste function if there's no selection
        wym.paste(html);
    }
};

WYMeditor.WymClassTridentPre7.prototype.wrap = function (left, right) {
    var wym = this,
        // Get the current selection
        range = wym._doc.selection.createRange(),
        $selectionParents;

    // Check if the current selection is inside the editor
    $selectionParents = jQuery(range.parentElement()).parents();
    if ($selectionParents.is(wym._options.iframeBodySelector)) {
        try {
            // Overwrite selection with provided html
            range.pasteHTML(left + range.text + right);
        } catch (e) {}
    }
};

/**
    _wrapWithContainer
    ==================

    Wraps the passed node in a container of the passed type. Also, restores the
    selection to being after the node within its new container.

    @param node A DOM node to be wrapped in a container
    @param containerType A string of an HTML tag that specifies the container
                         type to use for wrapping the node.
*/
WYMeditor.WymClassTridentPre7.prototype._wrapWithContainer = function (
    node, containerType
) {
    var wym = this,
        $wrappedNode,
        selection,
        range;

    $wrappedNode = jQuery(node).wrap('<' + containerType + ' />');
    selection = wym.selection();
    range = rangy.createRange(wym._doc);
    range.selectNodeContents($wrappedNode[0]);
    range.collapse();
    selection.setSingleRange(range);
};

WYMeditor.WymClassTridentPre7.prototype.unwrap = function () {
    var wym = this,
        // Get the current selection
        range = wym._doc.selection.createRange(),
        $selectionParents,
        text;

    // Check if the current selection is inside the editor
    $selectionParents = jQuery(range.parentElement()).parents();
    if ($selectionParents.is(wym._options.iframeBodySelector)) {
        try {
            // Unwrap selection
            text = range.text;
            wym._exec('Cut');
            range.pasteHTML(text);
        } catch (e) {}
    }
};

WYMeditor.WymClassTridentPre7.prototype._keyup = function (evt) {
    var wym = this,
        doc = wym._doc,
        container,
        defaultRootContainer,
        notValidRootContainers,
        name,
        parentName,
        forbiddenMainContainer = false,
        selectedNode;

    notValidRootContainers =
        wym.documentStructureManager.structureRules.notValidRootContainers;
    defaultRootContainer =
        wym.documentStructureManager.structureRules.defaultRootContainer;
    doc._selectedImage = null;

    // If the pressed key can't create a block element and is not a command,
    // check to make sure the selection is properly wrapped in a container
    if (!wym.keyCanCreateBlockElement(evt.which) &&
            evt.which !== WYMeditor.KEY_CODE.CTRL &&
            evt.which !== WYMeditor.KEY_CODE.COMMAND &&
            !evt.metaKey &&
            !evt.ctrlKey) {

        container = wym.selectedContainer();
        selectedNode = wym.selection().focusNode;
        if (container !== null) {
            name = container.tagName.toLowerCase();
        }
        if (container.parentNode) {
            parentName = container.parentNode.tagName.toLowerCase();
        }

        // Fix forbidden root containers
        if (wym.isForbiddenRootContainer(name)) {
            name = parentName;
            forbiddenMainContainer = true;
        }

        // Wrap text nodes and forbidden root containers with default root node
        // tags
        if (name === WYMeditor.BODY && selectedNode.nodeName === "#text") {
            // If we're in a forbidden root container, switch the selected node
            // to its parent node so that we wrap the forbidden root container
            // itself and not its inner text content
            if (forbiddenMainContainer) {
                selectedNode = selectedNode.parentNode;
            }
            wym._wrapWithContainer(selectedNode, defaultRootContainer);
            wym.prepareDocForEditing();
        }

        if (jQuery.inArray(name, notValidRootContainers) > -1 &&
                parentName === WYMeditor.BODY) {
            wym.switchTo(container, defaultRootContainer);
            wym.prepareDocForEditing();
        }
    }

    // If we potentially created a new block level element or moved to a new
    // one, then we should ensure the container is valid and the formatting is
    // proper.
    if (wym.keyCanCreateBlockElement(evt.which)) {
        // If the selected container is a root container, make sure it is not a
        // different possible default root container than the chosen one.
        container = wym.selectedContainer();
        name = container.tagName.toLowerCase();
        if (container.parentNode) {
            parentName = container.parentNode.tagName.toLowerCase();
        }
        if (jQuery.inArray(name, notValidRootContainers) > -1 &&
                parentName === WYMeditor.BODY) {
            wym.switchTo(container, defaultRootContainer);
        }

        // Call for the check for--and possible correction of--issue #430.
        wym._handlePotentialEnterInEmptyNestedLi(evt.which, container);

        // IE8 bug https://github.com/wymeditor/wymeditor/issues/446
        if (
            evt.which === WYMeditor.KEY_CODE.BACKSPACE &&
            jQuery.browser.versionNumber === 8 &&
            container.parentNode && (
                parentName === 'ul' ||
                parentName === 'ol'
            )
        ) {
            wym._fixInvalidListNesting(container);
        }

        // Fix formatting if necessary
        wym.prepareDocForEditing();
    }
};
