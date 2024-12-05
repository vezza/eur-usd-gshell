// This extensions shows EUR to USD convertion on Gnome panel.
// Copyright (C) 2024 vezza
// See LICENSE file

'use strict';

import St from 'gi://St'
import Gio from 'gi://Gio'
import Clutter from 'gi://Clutter'
import Soup from 'gi://Soup'
import GLib from 'gi://GLib'

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

let panelButton;
let panelButtonText;
let session;
let euroQuotation;
let sourceId = null;

// Handle Requests API Dollar
async function handle_request_euro_api() {
    try {
        // Create a new Soup Session
        if (!session) {
            session = new Soup.Session({ timeout: 10 });
        }

        // Create body of Soup request
        let message = Soup.Message.new_from_encoded_form(
            "GET", "https://economia.awesomeapi.com.br/last/EUR-USD", Soup.form_encode_hash({}));

        // Send Soup request to API Server
        await session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_, r0) => {
            let text = session.send_and_read_finish(r0);
            let response = new TextDecoder().decode(text.get_data());
            const body_response = JSON.parse(response);

            // Get the value of Euro Quotation
            euroQuotation = body_response["EURUSD"]["bid"];
            euroQuotation = euroQuotation.split(".");
            euroQuotation = euroQuotation[0] + "," + euroQuotation[1].substring(0, 4);

            // Sext text in Widget
            panelButtonText = new St.Label({
            style_class : "cPanelText",
                text: "(1 EUR = " + euroQuotation + " USD)",
                y_align: Clutter.ActorAlign.CENTER,
            });
            panelButton.set_child(panelButtonText);

            // Finish Soup Session
            session.abort();
            text = undefined;
            response = undefined;
        });
    } catch (error) {
        console.error(`Traceback Error in [handle_request_euro_api]: ${error}`);
        panelButtonText = new St.Label({
            text: "(1 EUR = " + _euroQuotation + ")" + " * ",
            y_align: Clutter.ActorAlign.CENTER,
        });
        panelButton.set_child(panelButtonText);
        session.abort();
    }
}

export default class eurusd {
    enable() {
        panelButton = new St.Bin({
            style_class: "panel-button",
        });
    
        handle_request_euro_api();
        Main.panel._centerBox.insert_child_at_index(panelButton, 0);
        sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
            handle_request_euro_api();
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        Main.panel._centerBox.remove_child(panelButton);
        
        if (panelButton) {
            panelButton.destroy();
            panelButton = null;
            panelButtonText = null;
            euroQuotation = null;
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
}
