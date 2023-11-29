// This extensions shows USD to TRY convertion on Gnome panel.
//Copyright (C) 2023  arfiesat
// See LICENSE file

'use strict';

import { St, Gio, Clutter, Soup, GLib } from gi;

import ExtensionUtils from 'resource:///org/gnome/shell/misc/ExtensionUtils.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import PanelMenu from 'resource:///org/gnome/shell/ui/PanelMenu';

const Me = ExtensionUtils.getCurrentExtension();

let panelButton;
let panelButtonText;
let session;
let dollarQuotation;
let sourceId = null;

// Start application
function init() {}

// Add the button to the panel
function enable() {
    panelButton = new St.Bin({
        style_class: "panel-button",
    });

    handle_request_dollar_api();
    Main.panel._centerBox.insert_child_at_index(panelButton, 0);
    sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
        handle_request_dollar_api();
        return GLib.SOURCE_CONTINUE;
    });
}

// Remove the added button from panel
function disable() {
    Main.panel._centerBox.remove_child(panelButton);

    if (panelButton) {
        panelButton.destroy();
        panelButton = null;
    }

    if (sourceId) {
        GLib.Source.remove(sourceId);
        sourceId = null;
    }
    
    if (session) {
        session.abort(session);
        session = null;
    }
}

// Handle Requests API Dollar
async function handle_request_dollar_api() {
    try {
        // Create a new Soup Session
        if (!session) {
            session = new Soup.Session({ timeout: 10 });
        }

        // Create body of Soup request
        let message = Soup.Message.new_from_encoded_form(
            "GET", "https://economia.awesomeapi.com.br/last/USD-TRY", Soup.form_encode_hash({}));

        // Send Soup request to API Server
        await session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_, r0) => {
            let text = session.send_and_read_finish(r0);
            let response = new TextDecoder().decode(text.get_data());
            const body_response = JSON.parse(response);

            // Get the value of Dollar Quotation
            dollarQuotation = body_response["USDTRY"]["bid"];
            dollarQuotation = dollarQuotation.split(".");
            dollarQuotation = dollarQuotation[0] + "," + dollarQuotation[1].substring(0, 2);

            // Sext text in Widget
            panelButtonText = new St.Label({
            style_class : "cPanelText",
                text: "(1 USD = " + dollarQuotation + " TRY)",
                y_align: Clutter.ActorAlign.CENTER,
            });
            panelButton.set_child(panelButtonText);

            // Finish Soup Session
            session.abort();
            text = undefined;
            response = undefined;
        });
    } catch (error) {
        console.error(`Traceback Error in [handle_request_dollar_api]: ${error}`);
        panelButtonText = new St.Label({
            text: "(1 USD = " + _dollarQuotation + ")" + " * ",
            y_align: Clutter.ActorAlign.CENTER,
        });
        panelButton.set_child(panelButtonText);
        session.abort();
    }
}