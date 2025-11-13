// This extensions shows EUR to USD convertion on Gnome panel.
// Copyright (C) 2024 vezza
// See LICENSE file

'use strict';

import St from 'gi://St';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

let panelButton;
let panelButtonText;
let session;
let sourceId = null;
let euroQuotation = null;
let currentApiIndex = 0;
let timeoutIds = []; // Array per tracciare tutti i timeout

// Lista di API alternative per il tasso di cambio
const exchangeApis = [
    {
        name: 'Frankfurter',
        url: 'https://api.frankfurter.app/latest?from=EUR&to=USD',
        parser: (data) => data.rates?.USD
    },
    {
        name: 'ExchangeRate-API',
        url: 'https://api.exchangerate-api.com/v4/latest/EUR',
        parser: (data) => data.rates?.USD
    },
    {
        name: 'AwesomeAPI',
        url: 'https://economia.awesomeapi.com.br/last/EUR-USD',
        parser: (data) => data.EURUSD?.bid
    }
];

// Handle Requests API Dollar
async function handle_request_euro_api() {
    try {
        // Create a new Soup Session
        if (!session) {
            session = new Soup.Session({ 
                timeout: 10,
                user_agent: 'Gnome-Shell-Extension/1.0'
            });
        }

        const currentApi = exchangeApis[currentApiIndex];
        console.log(`Using API: ${currentApi.name}`);
        
        let message = Soup.Message.new('GET', currentApi.url);
        
        // Send Soup request to API Server
        await session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_, result) => {
            try {
                let response = session.send_and_read_finish(result);
                let text = new TextDecoder().decode(response.get_data());
                console.log(`API ${currentApi.name} Response:`, text);
                
                const body_response = JSON.parse(text);

                // Verifica se c'è un errore di quota
                if (body_response.status === 429 || body_response.code === 'QuotaExceeded') {
                    throw new Error(`Quota exceeded for ${currentApi.name}`);
                }

                // Parsing dei dati con il parser specifico dell'API
                const rate = currentApi.parser(body_response);
                
                if (rate) {
                    let rateValue = rate.toString();
                    let rateParts = rateValue.split(".");
                    euroQuotation = rateParts[0] + "," + (rateParts[1] ? rateParts[1].substring(0, 4) : "0000");

                    updatePanelText("(1 EUR = " + euroQuotation + " USD)");
                    console.log(`Successfully got rate from ${currentApi.name}: ${euroQuotation}`);
                } else {
                    throw new Error(`Invalid data from ${currentApi.name}`);
                }

            } catch (parseError) {
                console.error(`Error with ${currentApi.name}:`, parseError);
                
                // Prova l'API successiva
                currentApiIndex = (currentApiIndex + 1) % exchangeApis.length;
                
                if (currentApiIndex === 0) {
                    // Se abbiamo provato tutte le API, mostra errore
                    updatePanelText("(API Limit)");
                } else {
                    // Ritenta immediatamente con la prossima API
                    const retryId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                        handle_request_euro_api();
                        return GLib.SOURCE_REMOVE;
                    });
                    timeoutIds.push(retryId);
                }
            }
        });
    } catch (error) {
        console.error(`Traceback Error in [handle_request_euro_api]: ${error}`);
        updatePanelText("(Network Error)");
        
        // Ritenta dopo 30 secondi
        const retryId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
            handle_request_euro_api();
            return GLib.SOURCE_REMOVE;
        });
        timeoutIds.push(retryId);
    }
}

// Funzione helper per aggiornare il testo
function updatePanelText(text) {
    if (panelButton) {
        let oldChild = panelButton.get_child();
        if (oldChild) {
            oldChild.destroy();
        }
        
        panelButtonText = new St.Label({
            style_class: "cPanelText",
            text: text,
            y_align: Clutter.ActorAlign.CENTER,
        });
        
        panelButton.set_child(panelButtonText);
    }
}

export default class Eurusd {
    enable() {
        panelButton = new St.Bin({
            style_class: "panel-button",
        });

        // Text iniziale
        updatePanelText("(Loading...)");

        Main.panel._centerBox.insert_child_at_index(panelButton, 0);
        
        // Prima chiamata immediata
        handle_request_euro_api();
        
        // Aggiornamento periodico ogni 60 secondi (ridotto per evitare limiti)
        sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, () => {
            handle_request_euro_api();
            return GLib.SOURCE_CONTINUE;
        });
        timeoutIds.push(sourceId);
    }

    disable() {
        // Rimuovi tutti i timeout
        timeoutIds.forEach(id => GLib.Source.remove(id));
        timeoutIds = [];
        
        if (sourceId) {
            GLib.Source.remove(sourceId);
            sourceId = null;
        }
        
        if (panelButton) {
            Main.panel._centerBox.remove_child(panelButton);
            panelButton.destroy();
            panelButton = null;
        }
        
        panelButtonText = null;
        euroQuotation = null;
        currentApiIndex = 0;
        
        if (session) {
            session.abort();
            session = null;
        }
    }
}