/**
 * LWC Compiler Worker Client
 *
 * This module provides a simple interface to communicate with the compiler-worker.js
 * scraped from Salesforce's Component Library.
 *
 * Usage:
 *   import CompilerClient from './compiler-client.js';
 *
 *   const compiler = new CompilerClient('/public/compiler-worker.js');
 *   const result = await compiler.compile(componentData);
 */

class CompilerClient {
  constructor(workerPath = "/public/compiler-worker.js") {
    this.worker = new Worker(workerPath);
    this.messageIdCounter = 0;
    this.pendingMessages = new Map();

    // Set up message handler
    this.worker.onmessage = this._handleMessage.bind(this);
    this.worker.onerror = this._handleError.bind(this);

    console.log("✅ CompilerClient initialized");
  }

  /**
   * Handle messages from the worker
   */
  _handleMessage(event) {
    const { messageId, res, error } = event.data;

    const pending = this.pendingMessages.get(messageId);
    if (pending) {
      if (error) {
        console.error("Compilation error:", error);
        pending.reject(new Error(JSON.stringify(error)));
      } else {
        console.log("Compilation successful");
        pending.resolve(res);
      }
      this.pendingMessages.delete(messageId);
    }
  }

  /**
   * Handle worker errors
   */
  _handleError(error) {
    console.error("Worker error:", error);
    // Reject all pending messages
    this.pendingMessages.forEach((pending) => {
      pending.reject(error);
    });
    this.pendingMessages.clear();
  }

  /**
   * Compile a Lightning Web Component
   *
   * @param {Object} data - Compilation data with files, project, and runtime config
   * @returns {Promise} - Resolves with compilation result
   */
  compile(data) {
    console.log("in compile", data);
    return new Promise((resolve, reject) => {
      const messageId = this.messageIdCounter++;

      this.pendingMessages.set(messageId, { resolve, reject });

      this.worker.postMessage({
        messageId: messageId,
        data: data,
      });
    });
  }

  /**
   * Create a simple component structure from files
   *
   * @param {string} componentName - Name of the component
   * @param {Object} files - Object with filename: content pairs
   * @param {Object} options - Additional options (namespace, minify, etc.)
   * @returns {Object} - Compilation data structure
   */
  createComponentData(componentName, files, options = {}) {
    // const template = {
    //   files: {
    //     "<root>": {
    //       type: "directory",
    //       id: "<root>",
    //       name: "root",
    //       path: "root",
    //       childIds: ["GmTdDF4lv"],
    //       opened: true,
    //     },
    //     GmTdDF4lv: {
    //       type: "directory",
    //       id: "GmTdDF4lv",
    //       name: "basic",
    //       path: "root/basic",
    //       childIds: ["NwdyjwHU7o", "pgV1rPshKs", "XlMJqS4FQT"],
    //       opened: true,
    //     },
    //     NwdyjwHU7o: {
    //       type: "file",
    //       id: "NwdyjwHU7o",
    //       name: "generateData.js",
    //       path: "root/basic/generateData.js",
    //       content:
    //         "// seeded PRNG function\nfunction mulberry32(a) {\n    return function () {\n        let t = (a += 0x6d2b79f5);\n        t = Math.imul(t ^ (t >>> 15), t | 1);\n        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);\n        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;\n    };\n}\nconst getRandom = mulberry32(12345); // insert seed\n\nexport default function generateData({ amountOfRecords }) {\n    return [...Array(amountOfRecords)].map((_, index) => {\n        return {\n            name: `Name (${index})`,\n            website: 'www.salesforce.com',\n            amount: Math.floor(getRandom() * 100),\n            phone: `${Math.floor(getRandom() * 9000000000) + 1000000000}`,\n            closeAt: new Date(\n                Date.now() + 86400000 * Math.ceil(getRandom() * 20)\n            ),\n        };\n    });\n}\n",
    //       childIds: [],
    //       opened: false,
    //     },
    //     pgV1rPshKs: {
    //       type: "file",
    //       id: "pgV1rPshKs",
    //       name: "basic.js",
    //       path: "root/basic/basic.js",
    //       content:
    //         "import { LightningElement } from 'lwc';\nimport generateData from './generateData';\n\nconst columns = [\n    { label: 'Label', fieldName: 'name' },\n    { label: 'Website', fieldName: 'website', type: 'url' },\n    { label: 'Phone', fieldName: 'phone', type: 'phone' },\n    { label: 'Balance', fieldName: 'amount', type: 'currency' },\n    { label: 'CloseAt', fieldName: 'closeAt', type: 'date' },\n];\n\nexport default class BasicDatatable extends LightningElement {\n    data = [];\n    columns = columns;\n\n    connectedCallback() {\n        const data = generateData({ amountOfRecords: 100 });\n        this.data = data;\n    }\n}\n",
    //       childIds: [],
    //       opened: false,
    //     },
    //     XlMJqS4FQT: {
    //       type: "file",
    //       id: "XlMJqS4FQT",
    //       name: "basic.html",
    //       path: "root/basic/basic.html",
    //       content:
    //         '<template>\n    <div style="height: 300px;">\n        <lightning-datatable\n                key-field="id"\n                data={data}\n                columns={columns}>\n        </lightning-datatable>\n    </div>\n</template>\n',
    //       childIds: [],
    //       opened: false,
    //     },
    //   },
    //   project: {
    //     name: "Basic Data Table",
    //     description:
    //       "A basic data table that fetches data during initialization. Set the server data on the data attribute. Display data based on the data type by defining the columns object.",
    //     namespace: "c",
    //     minify: false,
    //     compat: false,
    //     savefailed: false,
    //     mainModule: "basic",
    //     compileOnChange: true,
    //     isLoading: false,
    //   },
    //   workspace: {
    //     embedded: true,
    //     selectedTab: "preview",
    //     selectedFile: "XlMJqS4FQT",
    //     isCompiling: true,
    //     isCompilingOnChange: false,
    //     isDirty: false,
    //     compilationOutput: null,
    //     isDndUpload: false,
    //     changeCount: 0,
    //     compiledCount: 0,
    //     runCount: 0,
    //   },
    //   runtime: {
    //     lwc: {
    //       versions: [
    //         {
    //           version: "0.33.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.10/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.13/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.14/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.17",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.17/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.18",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.18/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.19",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.19/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.20",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.20/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.21",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.21/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.22",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.22/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.23",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.23/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.24",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.24/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.25",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.25/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.33.26",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.26/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.34.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.34.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.34.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.34.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.34.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.34.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.5/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.34.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.6/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.34.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.7/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.34.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.8/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.5/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.6/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.7/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.9/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.10/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.11/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.35.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.12/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.36.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.36.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.36.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.36.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.37.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.37.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.37.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.37.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.37.4-220.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.4-220.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.37.4-220.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.4-220.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.37.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.38.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.38.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.38.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.38.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.38.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.38.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.39.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.39.1-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.1-222.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.39.1-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.1-222.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.39.1-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.1-222.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.39.1-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.1-222.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.39.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.40.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.40.1-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.40.1-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.40.1-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.40.1-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.40.1-222.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.5/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.40.1-222.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.6/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.40.1-222.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.7/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.40.1-222.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.8/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.40.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.41.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.41.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.228.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.228.5/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.228.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.228.6/lwc-compiler.js",
    //         },
    //         {
    //           version: "0.228.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.228.7/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.5/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.6/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.7/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.8/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.9/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.10/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.11/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.12/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.13/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.14/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.15",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.15/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.16",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.16/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.17",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.17/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.18",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.18/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.19",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.19/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.20",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.20/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.21",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.21/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.22",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.22/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.23",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.23/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.24",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.24/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.25",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.25/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.26",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.26/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2-222.1000",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.1000/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.0.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.5/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.10/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.13-224.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.13-224.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.13-224.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.13-224.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.13-224.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.5/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.13-224.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.6/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.13-224.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.7/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.13-224.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.8/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.14/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.15",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.15/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.1.16",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.16/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.2.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.2.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.2.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.2.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.2.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.2.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.5/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.5/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.6/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-226.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-226.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-226.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-226.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-226.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-226.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.5/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-226.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.6/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-228.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-228.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-228.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-228.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-228.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-228.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7-228.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-228.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.8/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.9/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.10/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.11/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.3.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.12/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.4.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.4.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.5.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.5.0/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.5.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.5.1/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.5.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.5.2/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.5.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.5.3/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.5.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.5.4/lwc-compiler.js",
    //         },
    //         {
    //           version: "1.6.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.6.0/lwc-compiler.js",
    //         },
    //       ],
    //       tags: {
    //         next: "2.2.1",
    //         latest: "2.49.1",
    //         canary: "2.11.3-238prod.0",
    //         spring20: "1.1.13-224.8",
    //         winter20: "1.0.2-222.26",
    //         summer20: "1.3.7-226.7",
    //         spring19: "0.34.7",
    //         summer19: "0.37.4-220.2",
    //         winter19: "0.40.1-222.1",
    //         winter21: "1.7.10-228.5",
    //         spring21: "1.9.3-230.1",
    //         summer21: "1.17.9",
    //         winter22: "2.2.12",
    //         spring22: "2.5.13",
    //         "backport-2.6": "2.6.3",
    //         summer22: "2.11.8",
    //         winter23: "2.20.7",
    //         spring23: "2.31.8",
    //         "lbc-avante-garde": "2.40.2-lbc",
    //       },
    //       stable: "1.7.10-228.5",
    //     },
    //     engine: {
    //       versions: [
    //         {
    //           version: "0.33.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.10/engine.js",
    //         },
    //         {
    //           version: "0.33.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.13/engine.js",
    //         },
    //         {
    //           version: "0.33.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.14/engine.js",
    //         },
    //         {
    //           version: "0.33.17",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.17/engine.js",
    //         },
    //         {
    //           version: "0.33.18",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.18/engine.js",
    //         },
    //         {
    //           version: "0.33.19",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.19/engine.js",
    //         },
    //         {
    //           version: "0.33.20",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.20/engine.js",
    //         },
    //         {
    //           version: "0.33.21",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.21/engine.js",
    //         },
    //         {
    //           version: "0.33.22",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.22/engine.js",
    //         },
    //         {
    //           version: "0.33.23",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.23/engine.js",
    //         },
    //         {
    //           version: "0.33.24",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.24/engine.js",
    //         },
    //         {
    //           version: "0.33.25",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.25/engine.js",
    //         },
    //         {
    //           version: "0.33.26",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.33.26/engine.js",
    //         },
    //         {
    //           version: "0.34.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.0/engine.js",
    //         },
    //         {
    //           version: "0.34.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.1/engine.js",
    //         },
    //         {
    //           version: "0.34.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.2/engine.js",
    //         },
    //         {
    //           version: "0.34.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.3/engine.js",
    //         },
    //         {
    //           version: "0.34.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.4/engine.js",
    //         },
    //         {
    //           version: "0.34.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.5/engine.js",
    //         },
    //         {
    //           version: "0.34.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.6/engine.js",
    //         },
    //         {
    //           version: "0.34.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.7/engine.js",
    //         },
    //         {
    //           version: "0.34.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.34.8/engine.js",
    //         },
    //         {
    //           version: "0.35.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.0/engine.js",
    //         },
    //         {
    //           version: "0.35.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.1/engine.js",
    //         },
    //         {
    //           version: "0.35.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.2/engine.js",
    //         },
    //         {
    //           version: "0.35.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.3/engine.js",
    //         },
    //         {
    //           version: "0.35.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.4/engine.js",
    //         },
    //         {
    //           version: "0.35.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.5/engine.js",
    //         },
    //         {
    //           version: "0.35.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.6/engine.js",
    //         },
    //         {
    //           version: "0.35.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.7/engine.js",
    //         },
    //         {
    //           version: "0.35.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.9/engine.js",
    //         },
    //         {
    //           version: "0.35.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.10/engine.js",
    //         },
    //         {
    //           version: "0.35.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.11/engine.js",
    //         },
    //         {
    //           version: "0.35.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.35.12/engine.js",
    //         },
    //         {
    //           version: "0.36.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.36.0/engine.js",
    //         },
    //         {
    //           version: "0.36.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.36.1/engine.js",
    //         },
    //         {
    //           version: "0.37.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.0/engine.js",
    //         },
    //         {
    //           version: "0.37.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.1/engine.js",
    //         },
    //         {
    //           version: "0.37.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.2/engine.js",
    //         },
    //         {
    //           version: "0.37.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.3/engine.js",
    //         },
    //         {
    //           version: "0.37.4-220.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.4-220.1/engine.js",
    //         },
    //         {
    //           version: "0.37.4-220.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.4-220.2/engine.js",
    //         },
    //         {
    //           version: "0.37.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.37.4/engine.js",
    //         },
    //         {
    //           version: "0.38.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.38.0/engine.js",
    //         },
    //         {
    //           version: "0.38.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.38.1/engine.js",
    //         },
    //         {
    //           version: "0.38.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.38.2/engine.js",
    //         },
    //         {
    //           version: "0.39.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.0/engine.js",
    //         },
    //         {
    //           version: "0.39.1-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.1-222.1/engine.js",
    //         },
    //         {
    //           version: "0.39.1-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.1-222.2/engine.js",
    //         },
    //         {
    //           version: "0.39.1-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.1-222.3/engine.js",
    //         },
    //         {
    //           version: "0.39.1-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.1-222.4/engine.js",
    //         },
    //         {
    //           version: "0.39.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.39.1/engine.js",
    //         },
    //         {
    //           version: "0.40.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.0/engine.js",
    //         },
    //         {
    //           version: "0.40.1-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.1/engine.js",
    //         },
    //         {
    //           version: "0.40.1-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.2/engine.js",
    //         },
    //         {
    //           version: "0.40.1-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.3/engine.js",
    //         },
    //         {
    //           version: "0.40.1-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.4/engine.js",
    //         },
    //         {
    //           version: "0.40.1-222.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.5/engine.js",
    //         },
    //         {
    //           version: "0.40.1-222.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.6/engine.js",
    //         },
    //         {
    //           version: "0.40.1-222.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.7/engine.js",
    //         },
    //         {
    //           version: "0.40.1-222.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1-222.8/engine.js",
    //         },
    //         {
    //           version: "0.40.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.40.1/engine.js",
    //         },
    //         {
    //           version: "0.41.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.41.0/engine.js",
    //         },
    //         {
    //           version: "0.228.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.228.5/engine.js",
    //         },
    //         {
    //           version: "0.228.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.228.6/engine.js",
    //         },
    //         {
    //           version: "0.228.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/0.228.7/engine.js",
    //         },
    //         {
    //           version: "1.0.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.0/engine.js",
    //         },
    //         {
    //           version: "1.0.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.1/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.1/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.2/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.3/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.4/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.5/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.6/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.7/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.8/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.9/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.10/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.11/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.12/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.13/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.14/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.15",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.15/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.16",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.16/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.17",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.17/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.18",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.18/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.19",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.19/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.20",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.20/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.21",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.21/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.22",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.22/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.23",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.23/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.24",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.24/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.25",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.25/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.26",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.26/engine.js",
    //         },
    //         {
    //           version: "1.0.2-222.1000",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2-222.1000/engine.js",
    //         },
    //         {
    //           version: "1.0.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.2/engine.js",
    //         },
    //         {
    //           version: "1.0.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.0.3/engine.js",
    //         },
    //         {
    //           version: "1.1.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.4/engine.js",
    //         },
    //         {
    //           version: "1.1.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.5/engine.js",
    //         },
    //         {
    //           version: "1.1.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.10/engine.js",
    //         },
    //         {
    //           version: "1.1.13-224.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.1/engine.js",
    //         },
    //         {
    //           version: "1.1.13-224.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.2/engine.js",
    //         },
    //         {
    //           version: "1.1.13-224.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.3/engine.js",
    //         },
    //         {
    //           version: "1.1.13-224.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.4/engine.js",
    //         },
    //         {
    //           version: "1.1.13-224.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.5/engine.js",
    //         },
    //         {
    //           version: "1.1.13-224.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.6/engine.js",
    //         },
    //         {
    //           version: "1.1.13-224.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.7/engine.js",
    //         },
    //         {
    //           version: "1.1.13-224.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.13-224.8/engine.js",
    //         },
    //         {
    //           version: "1.1.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.14/engine.js",
    //         },
    //         {
    //           version: "1.1.15",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.15/engine.js",
    //         },
    //         {
    //           version: "1.1.16",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.1.16/engine.js",
    //         },
    //         {
    //           version: "1.2.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.0/engine.js",
    //         },
    //         {
    //           version: "1.2.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.1/engine.js",
    //         },
    //         {
    //           version: "1.2.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.2/engine.js",
    //         },
    //         {
    //           version: "1.2.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.3/engine.js",
    //         },
    //         {
    //           version: "1.2.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.4/engine.js",
    //         },
    //         {
    //           version: "1.2.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.2.5/engine.js",
    //         },
    //         {
    //           version: "1.3.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.0/engine.js",
    //         },
    //         {
    //           version: "1.3.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.1/engine.js",
    //         },
    //         {
    //           version: "1.3.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.2/engine.js",
    //         },
    //         {
    //           version: "1.3.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.3/engine.js",
    //         },
    //         {
    //           version: "1.3.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.4/engine.js",
    //         },
    //         {
    //           version: "1.3.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.5/engine.js",
    //         },
    //         {
    //           version: "1.3.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.6/engine.js",
    //         },
    //         {
    //           version: "1.3.7-226.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.0/engine.js",
    //         },
    //         {
    //           version: "1.3.7-226.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.1/engine.js",
    //         },
    //         {
    //           version: "1.3.7-226.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.2/engine.js",
    //         },
    //         {
    //           version: "1.3.7-226.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.3/engine.js",
    //         },
    //         {
    //           version: "1.3.7-226.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.4/engine.js",
    //         },
    //         {
    //           version: "1.3.7-226.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.5/engine.js",
    //         },
    //         {
    //           version: "1.3.7-226.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-226.6/engine.js",
    //         },
    //         {
    //           version: "1.3.7-228.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-228.1/engine.js",
    //         },
    //         {
    //           version: "1.3.7-228.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-228.2/engine.js",
    //         },
    //         {
    //           version: "1.3.7-228.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-228.3/engine.js",
    //         },
    //         {
    //           version: "1.3.7-228.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7-228.4/engine.js",
    //         },
    //         {
    //           version: "1.3.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.7/engine.js",
    //         },
    //         {
    //           version: "1.3.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.8/engine.js",
    //         },
    //         {
    //           version: "1.3.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.9/engine.js",
    //         },
    //         {
    //           version: "1.3.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.10/engine.js",
    //         },
    //         {
    //           version: "1.3.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.11/engine.js",
    //         },
    //         {
    //           version: "1.3.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.3.12/engine.js",
    //         },
    //         {
    //           version: "1.4.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.4.0/engine.js",
    //         },
    //         {
    //           version: "1.5.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.5.0/engine.js",
    //         },
    //         {
    //           version: "1.5.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.5.1/engine.js",
    //         },
    //         {
    //           version: "1.5.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.5.2/engine.js",
    //         },
    //         {
    //           version: "1.5.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.5.3/engine.js",
    //         },
    //         {
    //           version: "1.5.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.5.4/engine.js",
    //         },
    //         {
    //           version: "1.6.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.6.0/engine.js",
    //         },
    //       ],
    //       tags: {
    //         next: "1.18.0",
    //         latest: "1.17.6",
    //         canary: "1.18.0-alpha.3",
    //         spring20: "1.1.13-224.8",
    //         winter20: "1.0.2-222.26",
    //         summer20: "1.3.7-226.7",
    //         spring19: "0.34.7",
    //         summer19: "0.37.4-220.2",
    //         winter19: "0.40.1-222.1",
    //         winter21: "1.7.10-228.5",
    //         spring21: "1.9.3-230.1",
    //         summer21: "1.17.9",
    //       },
    //       stable: "1.7.10-228.5",
    //     },
    //     components: {
    //       versions: [
    //         {
    //           version: "1.4.4-alpha",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-components/1.4.4-alpha/lwc-components-lightning.json",
    //         },
    //         {
    //           version: "1.8.6-alpha",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-components/1.8.6-alpha/lwc-components-lightning.json",
    //         },
    //         {
    //           version: "1.10.8-alpha",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-components/1.10.8-alpha/lwc-components-lightning.json",
    //         },
    //         {
    //           version: "1.11.3-alpha",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-components/1.11.3-alpha/lwc-components-lightning.json",
    //         },
    //       ],
    //       tags: {
    //         "228-patch": "1.8.6-alpha",
    //         "230-patch": "1.10.8-alpha",
    //         latest: "1.11.3-alpha",
    //         main: "1.4.4-alpha",
    //       },
    //       stable: "1.8.6-alpha",
    //     },
    //     slds: {
    //       versions: [
    //         {
    //           version: "0.9.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/0.9.0",
    //         },
    //         {
    //           version: "0.9.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/0.9.1",
    //         },
    //         {
    //           version: "0.9.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/0.9.2",
    //         },
    //         {
    //           version: "0.10.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/0.10.0",
    //         },
    //         {
    //           version: "0.10.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/0.10.1",
    //         },
    //         {
    //           version: "0.11.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/0.11.0",
    //         },
    //         {
    //           version: "0.12.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/0.12.0",
    //         },
    //         {
    //           version: "0.12.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/0.12.1",
    //         },
    //         {
    //           version: "0.12.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/0.12.2",
    //         },
    //         {
    //           version: "1.0.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/1.0.0",
    //         },
    //         {
    //           version: "1.0.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/1.0.1",
    //         },
    //         {
    //           version: "1.0.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/1.0.2",
    //         },
    //         {
    //           version: "1.0.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/1.0.3",
    //         },
    //         {
    //           version: "1.0.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/1.0.4",
    //         },
    //         {
    //           version: "1.0.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/1.0.5",
    //         },
    //         {
    //           version: "2.0.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.0.0",
    //         },
    //         {
    //           version: "2.0.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.0.1",
    //         },
    //         {
    //           version: "2.0.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.0.2",
    //         },
    //         {
    //           version: "2.0.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.0.3",
    //         },
    //         {
    //           version: "2.1.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.1.2",
    //         },
    //         {
    //           version: "2.1.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.1.3",
    //         },
    //         {
    //           version: "2.1.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.1.4",
    //         },
    //         {
    //           version: "2.2.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.2.0",
    //         },
    //         {
    //           version: "2.2.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.2.1",
    //         },
    //         {
    //           version: "2.2.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.2.2",
    //         },
    //         {
    //           version: "2.3.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.3.0",
    //         },
    //         {
    //           version: "2.3.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.3.1",
    //         },
    //         {
    //           version: "2.4.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.4.1",
    //         },
    //         {
    //           version: "2.4.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.4.2",
    //         },
    //         {
    //           version: "2.4.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.4.3",
    //         },
    //         {
    //           version: "2.4.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.4.4",
    //         },
    //         {
    //           version: "2.4.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.4.5",
    //         },
    //         {
    //           version: "2.5.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.5.0",
    //         },
    //         {
    //           version: "2.5.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.5.2",
    //         },
    //         {
    //           version: "2.6.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.6.0",
    //         },
    //         {
    //           version: "2.6.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.6.1",
    //         },
    //         {
    //           version: "2.6.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.6.2",
    //         },
    //         {
    //           version: "2.7.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.7.0",
    //         },
    //         {
    //           version: "2.7.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.7.1",
    //         },
    //         {
    //           version: "2.7.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.7.2",
    //         },
    //         {
    //           version: "2.7.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.7.4",
    //         },
    //         {
    //           version: "2.7.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.7.5",
    //         },
    //         {
    //           version: "2.8.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.8.0",
    //         },
    //         {
    //           version: "2.8.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.8.1",
    //         },
    //         {
    //           version: "2.8.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.8.2",
    //         },
    //         {
    //           version: "2.8.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.8.3",
    //         },
    //         {
    //           version: "2.9.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.9.0",
    //         },
    //         {
    //           version: "2.9.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.9.1",
    //         },
    //         {
    //           version: "2.9.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.9.2",
    //         },
    //         {
    //           version: "2.9.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.9.3",
    //         },
    //         {
    //           version: "2.9.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.9.4",
    //         },
    //         {
    //           version: "2.9.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.9.5",
    //         },
    //         {
    //           version: "2.10.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.10.0",
    //         },
    //         {
    //           version: "2.10.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.10.1",
    //         },
    //         {
    //           version: "2.10.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.10.2",
    //         },
    //         {
    //           version: "2.11.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.11.0",
    //         },
    //         {
    //           version: "2.11.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.11.1",
    //         },
    //         {
    //           version: "2.11.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.11.2",
    //         },
    //         {
    //           version: "2.11.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.11.3",
    //         },
    //         {
    //           version: "2.11.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.11.4",
    //         },
    //         {
    //           version: "2.11.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.11.5",
    //         },
    //         {
    //           version: "2.11.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.11.6",
    //         },
    //         {
    //           version: "2.11.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.11.7",
    //         },
    //         {
    //           version: "2.11.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.11.8",
    //         },
    //         {
    //           version: "2.11.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.11.9",
    //         },
    //         {
    //           version: "2.12.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.12.0",
    //         },
    //         {
    //           version: "2.12.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.12.1",
    //         },
    //         {
    //           version: "2.12.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.12.2",
    //         },
    //         {
    //           version: "2.13.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.13.0",
    //         },
    //         {
    //           version: "2.13.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.13.1",
    //         },
    //         {
    //           version: "2.13.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.13.2",
    //         },
    //         {
    //           version: "2.13.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.13.3",
    //         },
    //         {
    //           version: "2.13.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.13.5",
    //         },
    //         {
    //           version: "2.13.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.13.6",
    //         },
    //         {
    //           version: "2.13.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.13.7",
    //         },
    //         {
    //           version: "2.14.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.14.0",
    //         },
    //         {
    //           version: "2.14.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.14.1",
    //         },
    //         {
    //           version: "2.14.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.14.2",
    //         },
    //         {
    //           version: "2.14.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.14.3",
    //         },
    //         {
    //           version: "2.15.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.15.0",
    //         },
    //         {
    //           version: "2.15.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.15.1",
    //         },
    //         {
    //           version: "2.15.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.15.2",
    //         },
    //         {
    //           version: "2.15.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.15.3",
    //         },
    //         {
    //           version: "2.15.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.15.4",
    //         },
    //         {
    //           version: "2.15.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.15.5",
    //         },
    //         {
    //           version: "2.15.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.15.6",
    //         },
    //         {
    //           version: "2.15.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.15.7",
    //         },
    //         {
    //           version: "2.15.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.15.8",
    //         },
    //         {
    //           version: "2.15.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.15.9",
    //         },
    //         {
    //           version: "2.16.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.16.0",
    //         },
    //         {
    //           version: "2.16.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.16.1",
    //         },
    //         {
    //           version: "2.16.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.16.2",
    //         },
    //         {
    //           version: "2.17.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.17.0",
    //         },
    //         {
    //           version: "2.17.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.17.1",
    //         },
    //         {
    //           version: "2.17.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.17.2",
    //         },
    //         {
    //           version: "2.17.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.17.3",
    //         },
    //         {
    //           version: "2.17.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.17.4",
    //         },
    //         {
    //           version: "2.17.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.17.5",
    //         },
    //         {
    //           version: "2.18.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.18.0",
    //         },
    //         {
    //           version: "2.18.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.18.1",
    //         },
    //         {
    //           version: "2.19.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.19.0",
    //         },
    //         {
    //           version: "2.20.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.20.0",
    //         },
    //         {
    //           version: "2.20.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.20.1",
    //         },
    //         {
    //           version: "2.21.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.21.0",
    //         },
    //         {
    //           version: "2.21.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.21.1",
    //         },
    //       ],
    //       tags: {
    //         latest: "2.21.1",
    //         lwc: "3.0.0-alpha.12",
    //         "winter-19": "2.7.5",
    //         "spring-19": "2.8.3",
    //         "summer-18": "2.6.2",
    //         "summer-19": "2.9.5",
    //         "winter-20": "2.10.2",
    //         "spring-20": "2.11.9",
    //         "summer-20": "2.12.2",
    //         "winter-21": "2.13.7",
    //         "spring-21": "2.14.3",
    //         "summer-21": "2.15.9",
    //         main: "2.22.0-alpha.2",
    //         "winter-22": "2.16.2",
    //         "spring-22": "2.17.5",
    //         "summer-22": "2.18.1",
    //         "winter-23": "2.19.0",
    //         "spring-23": "2.20.1",
    //         "summer-23": "2.21.1",
    //         "winter-24": "2.22.0-alpha.2",
    //       },
    //       stable: "2.13.7",
    //     },
    //     showVersions: false,
    //     standalone: true,
    //     isLoading: false,
    //     isLoaded: true,
    //     "wire-service": {
    //       versions: [
    //         {
    //           version: "0.33.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.13/wire-service.json",
    //         },
    //         {
    //           version: "0.33.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.14/wire-service.json",
    //         },
    //         {
    //           version: "0.33.17",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.17/wire-service.json",
    //         },
    //         {
    //           version: "0.33.18",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.18/wire-service.json",
    //         },
    //         {
    //           version: "0.33.19",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.19/wire-service.json",
    //         },
    //         {
    //           version: "0.33.20",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.20/wire-service.json",
    //         },
    //         {
    //           version: "0.33.21",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.21/wire-service.json",
    //         },
    //         {
    //           version: "0.33.22",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.22/wire-service.json",
    //         },
    //         {
    //           version: "0.33.23",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.23/wire-service.json",
    //         },
    //         {
    //           version: "0.33.24",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.24/wire-service.json",
    //         },
    //         {
    //           version: "0.33.25",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.25/wire-service.json",
    //         },
    //         {
    //           version: "0.33.26",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.33.26/wire-service.json",
    //         },
    //         {
    //           version: "0.34.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.34.0/wire-service.json",
    //         },
    //         {
    //           version: "0.34.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.34.1/wire-service.json",
    //         },
    //         {
    //           version: "0.34.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.34.2/wire-service.json",
    //         },
    //         {
    //           version: "0.34.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.34.3/wire-service.json",
    //         },
    //         {
    //           version: "0.34.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.34.4/wire-service.json",
    //         },
    //         {
    //           version: "0.34.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.34.5/wire-service.json",
    //         },
    //         {
    //           version: "0.34.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.34.6/wire-service.json",
    //         },
    //         {
    //           version: "0.34.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.34.7/wire-service.json",
    //         },
    //         {
    //           version: "0.34.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.34.8/wire-service.json",
    //         },
    //         {
    //           version: "0.35.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.0/wire-service.json",
    //         },
    //         {
    //           version: "0.35.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.1/wire-service.json",
    //         },
    //         {
    //           version: "0.35.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.2/wire-service.json",
    //         },
    //         {
    //           version: "0.35.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.3/wire-service.json",
    //         },
    //         {
    //           version: "0.35.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.4/wire-service.json",
    //         },
    //         {
    //           version: "0.35.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.5/wire-service.json",
    //         },
    //         {
    //           version: "0.35.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.6/wire-service.json",
    //         },
    //         {
    //           version: "0.35.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.7/wire-service.json",
    //         },
    //         {
    //           version: "0.35.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.9/wire-service.json",
    //         },
    //         {
    //           version: "0.35.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.10/wire-service.json",
    //         },
    //         {
    //           version: "0.35.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.11/wire-service.json",
    //         },
    //         {
    //           version: "0.35.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.35.12/wire-service.json",
    //         },
    //         {
    //           version: "0.36.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.36.0/wire-service.json",
    //         },
    //         {
    //           version: "0.36.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.36.1/wire-service.json",
    //         },
    //         {
    //           version: "0.37.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.37.0/wire-service.json",
    //         },
    //         {
    //           version: "0.37.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.37.1/wire-service.json",
    //         },
    //         {
    //           version: "0.37.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.37.2/wire-service.json",
    //         },
    //         {
    //           version: "0.37.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.37.3/wire-service.json",
    //         },
    //         {
    //           version: "0.37.4-220.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.37.4-220.1/wire-service.json",
    //         },
    //         {
    //           version: "0.37.4-220.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.37.4-220.2/wire-service.json",
    //         },
    //         {
    //           version: "0.37.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.37.4/wire-service.json",
    //         },
    //         {
    //           version: "0.38.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.38.0/wire-service.json",
    //         },
    //         {
    //           version: "0.38.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.38.1/wire-service.json",
    //         },
    //         {
    //           version: "0.38.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.38.2/wire-service.json",
    //         },
    //         {
    //           version: "0.39.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.39.0/wire-service.json",
    //         },
    //         {
    //           version: "0.39.1-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.39.1-222.1/wire-service.json",
    //         },
    //         {
    //           version: "0.39.1-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.39.1-222.2/wire-service.json",
    //         },
    //         {
    //           version: "0.39.1-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.39.1-222.3/wire-service.json",
    //         },
    //         {
    //           version: "0.39.1-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.39.1-222.4/wire-service.json",
    //         },
    //         {
    //           version: "0.39.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.39.1/wire-service.json",
    //         },
    //         {
    //           version: "0.40.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.40.0/wire-service.json",
    //         },
    //         {
    //           version: "0.40.1-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.40.1-222.1/wire-service.json",
    //         },
    //         {
    //           version: "0.40.1-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.40.1-222.2/wire-service.json",
    //         },
    //         {
    //           version: "0.40.1-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.40.1-222.3/wire-service.json",
    //         },
    //         {
    //           version: "0.40.1-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.40.1-222.4/wire-service.json",
    //         },
    //         {
    //           version: "0.40.1-222.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.40.1-222.5/wire-service.json",
    //         },
    //         {
    //           version: "0.40.1-222.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.40.1-222.6/wire-service.json",
    //         },
    //         {
    //           version: "0.40.1-222.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.40.1-222.7/wire-service.json",
    //         },
    //         {
    //           version: "0.40.1-222.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.40.1-222.8/wire-service.json",
    //         },
    //         {
    //           version: "0.40.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.40.1/wire-service.json",
    //         },
    //         {
    //           version: "0.41.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.41.0/wire-service.json",
    //         },
    //         {
    //           version: "0.228.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.228.5/wire-service.json",
    //         },
    //         {
    //           version: "0.228.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.228.6/wire-service.json",
    //         },
    //         {
    //           version: "0.228.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/0.228.7/wire-service.json",
    //         },
    //         {
    //           version: "1.0.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.0/wire-service.json",
    //         },
    //         {
    //           version: "1.0.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.1/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.1/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.2/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.3/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.4/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.5/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.6/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.7/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.8/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.9/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.10/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.11/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.12/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.13/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.14/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.15",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.15/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.16",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.16/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.17",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.17/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.18",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.18/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.19",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.19/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.20",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.20/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.21",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.21/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.22",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.22/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.23",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.23/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.24",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.24/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.25",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.25/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.26",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.26/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2-222.1000",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2-222.1000/wire-service.json",
    //         },
    //         {
    //           version: "1.0.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.2/wire-service.json",
    //         },
    //         {
    //           version: "1.0.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.0.3/wire-service.json",
    //         },
    //         {
    //           version: "1.1.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.0/wire-service.json",
    //         },
    //         {
    //           version: "1.1.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.1/wire-service.json",
    //         },
    //         {
    //           version: "1.1.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.3/wire-service.json",
    //         },
    //         {
    //           version: "1.1.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.4/wire-service.json",
    //         },
    //         {
    //           version: "1.1.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.5/wire-service.json",
    //         },
    //         {
    //           version: "1.1.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.6/wire-service.json",
    //         },
    //         {
    //           version: "1.1.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.7/wire-service.json",
    //         },
    //         {
    //           version: "1.1.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.8/wire-service.json",
    //         },
    //         {
    //           version: "1.1.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.9/wire-service.json",
    //         },
    //         {
    //           version: "1.1.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.10/wire-service.json",
    //         },
    //         {
    //           version: "1.1.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.11/wire-service.json",
    //         },
    //         {
    //           version: "1.1.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.12/wire-service.json",
    //         },
    //         {
    //           version: "1.1.13-224.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.13-224.1/wire-service.json",
    //         },
    //         {
    //           version: "1.1.13-224.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.13-224.2/wire-service.json",
    //         },
    //         {
    //           version: "1.1.13-224.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.13-224.3/wire-service.json",
    //         },
    //         {
    //           version: "1.1.13-224.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.13-224.4/wire-service.json",
    //         },
    //         {
    //           version: "1.1.13-224.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.13-224.5/wire-service.json",
    //         },
    //         {
    //           version: "1.1.13-224.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.13-224.6/wire-service.json",
    //         },
    //         {
    //           version: "1.1.13-224.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.13-224.7/wire-service.json",
    //         },
    //         {
    //           version: "1.1.13-224.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.13-224.8/wire-service.json",
    //         },
    //         {
    //           version: "1.1.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.13/wire-service.json",
    //         },
    //         {
    //           version: "1.1.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.14/wire-service.json",
    //         },
    //         {
    //           version: "1.1.15",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.15/wire-service.json",
    //         },
    //         {
    //           version: "1.1.16",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.1.16/wire-service.json",
    //         },
    //         {
    //           version: "1.2.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.2.0/wire-service.json",
    //         },
    //         {
    //           version: "1.2.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.2.1/wire-service.json",
    //         },
    //         {
    //           version: "1.2.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.2.2/wire-service.json",
    //         },
    //         {
    //           version: "1.2.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.2.3/wire-service.json",
    //         },
    //         {
    //           version: "1.2.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.2.4/wire-service.json",
    //         },
    //         {
    //           version: "1.2.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.2.5/wire-service.json",
    //         },
    //         {
    //           version: "1.3.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.0/wire-service.json",
    //         },
    //         {
    //           version: "1.3.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.1/wire-service.json",
    //         },
    //         {
    //           version: "1.3.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.2/wire-service.json",
    //         },
    //         {
    //           version: "1.3.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.3/wire-service.json",
    //         },
    //         {
    //           version: "1.3.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.4/wire-service.json",
    //         },
    //         {
    //           version: "1.3.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.5/wire-service.json",
    //         },
    //         {
    //           version: "1.3.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.6/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-226.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-226.0/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-226.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-226.1/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-226.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-226.2/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-226.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-226.3/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-226.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-226.4/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-226.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-226.5/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-226.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-226.6/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-226.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-226.7/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-228.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-228.1/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-228.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-228.2/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-228.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-228.3/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7-228.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7-228.4/wire-service.json",
    //         },
    //         {
    //           version: "1.3.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.7/wire-service.json",
    //         },
    //         {
    //           version: "1.3.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.8/wire-service.json",
    //         },
    //         {
    //           version: "1.3.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.9/wire-service.json",
    //         },
    //         {
    //           version: "1.3.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.10/wire-service.json",
    //         },
    //         {
    //           version: "1.3.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.11/wire-service.json",
    //         },
    //         {
    //           version: "1.3.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.3.12/wire-service.json",
    //         },
    //         {
    //           version: "1.4.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.4.0/wire-service.json",
    //         },
    //         {
    //           version: "1.5.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.5.0/wire-service.json",
    //         },
    //         {
    //           version: "1.5.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.5.1/wire-service.json",
    //         },
    //         {
    //           version: "1.5.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.5.2/wire-service.json",
    //         },
    //         {
    //           version: "1.5.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.5.3/wire-service.json",
    //         },
    //         {
    //           version: "1.5.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.5.4/wire-service.json",
    //         },
    //         {
    //           version: "1.6.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.6.0/wire-service.json",
    //         },
    //         {
    //           version: "1.6.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.6.1/wire-service.json",
    //         },
    //         {
    //           version: "1.6.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.6.2/wire-service.json",
    //         },
    //         {
    //           version: "1.6.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.6.3/wire-service.json",
    //         },
    //         {
    //           version: "1.6.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.6.4/wire-service.json",
    //         },
    //         {
    //           version: "1.6.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.6.5/wire-service.json",
    //         },
    //         {
    //           version: "1.6.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.6.6/wire-service.json",
    //         },
    //         {
    //           version: "1.6.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.6.7/wire-service.json",
    //         },
    //         {
    //           version: "1.6.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.6.8/wire-service.json",
    //         },
    //         {
    //           version: "1.6.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.6.9/wire-service.json",
    //         },
    //         {
    //           version: "1.7.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.0/wire-service.json",
    //         },
    //         {
    //           version: "1.7.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.1/wire-service.json",
    //         },
    //         {
    //           version: "1.7.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.2/wire-service.json",
    //         },
    //         {
    //           version: "1.7.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.3/wire-service.json",
    //         },
    //         {
    //           version: "1.7.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.4/wire-service.json",
    //         },
    //         {
    //           version: "1.7.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.5/wire-service.json",
    //         },
    //         {
    //           version: "1.7.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.6/wire-service.json",
    //         },
    //         {
    //           version: "1.7.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.7/wire-service.json",
    //         },
    //         {
    //           version: "1.7.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.8/wire-service.json",
    //         },
    //         {
    //           version: "1.7.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.9/wire-service.json",
    //         },
    //         {
    //           version: "1.7.10-228.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.10-228.1/wire-service.json",
    //         },
    //         {
    //           version: "1.7.10-228.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.10-228.2/wire-service.json",
    //         },
    //         {
    //           version: "1.7.10-228.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.10-228.3/wire-service.json",
    //         },
    //         {
    //           version: "1.7.10-228.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.10-228.4/wire-service.json",
    //         },
    //         {
    //           version: "1.7.10-228.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.10-228.5/wire-service.json",
    //         },
    //         {
    //           version: "1.7.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.10/wire-service.json",
    //         },
    //         {
    //           version: "1.7.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.11/wire-service.json",
    //         },
    //         {
    //           version: "1.7.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.12/wire-service.json",
    //         },
    //         {
    //           version: "1.7.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.13/wire-service.json",
    //         },
    //         {
    //           version: "1.7.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.14/wire-service.json",
    //         },
    //         {
    //           version: "1.8.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.0/wire-service.json",
    //         },
    //         {
    //           version: "1.8.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.1/wire-service.json",
    //         },
    //         {
    //           version: "1.8.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.2/wire-service.json",
    //         },
    //         {
    //           version: "1.8.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.3/wire-service.json",
    //         },
    //         {
    //           version: "1.8.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.4/wire-service.json",
    //         },
    //         {
    //           version: "1.8.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.5/wire-service.json",
    //         },
    //         {
    //           version: "1.8.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.6/wire-service.json",
    //         },
    //         {
    //           version: "1.8.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.7/wire-service.json",
    //         },
    //         {
    //           version: "1.9.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.0/wire-service.json",
    //         },
    //         {
    //           version: "1.9.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.1/wire-service.json",
    //         },
    //         {
    //           version: "1.9.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.2/wire-service.json",
    //         },
    //         {
    //           version: "1.9.3-230.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.3-230.1/wire-service.json",
    //         },
    //         {
    //           version: "1.9.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.3/wire-service.json",
    //         },
    //         {
    //           version: "1.9.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.4/wire-service.json",
    //         },
    //         {
    //           version: "1.9.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.5/wire-service.json",
    //         },
    //         {
    //           version: "1.9.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.6/wire-service.json",
    //         },
    //         {
    //           version: "1.9.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.7/wire-service.json",
    //         },
    //         {
    //           version: "1.9.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.8/wire-service.json",
    //         },
    //         {
    //           version: "1.10.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.10.0/wire-service.json",
    //         },
    //         {
    //           version: "1.10.1-232.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.10.1-232.1/wire-service.json",
    //         },
    //         {
    //           version: "1.10.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.10.1/wire-service.json",
    //         },
    //         {
    //           version: "1.11.0-232.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.0-232.1/wire-service.json",
    //         },
    //         {
    //           version: "1.11.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.0/wire-service.json",
    //         },
    //         {
    //           version: "1.11.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.1/wire-service.json",
    //         },
    //         {
    //           version: "1.11.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.2/wire-service.json",
    //         },
    //         {
    //           version: "1.11.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.3/wire-service.json",
    //         },
    //         {
    //           version: "1.11.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.4/wire-service.json",
    //         },
    //         {
    //           version: "1.16.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.16.4/wire-service.json",
    //         },
    //         {
    //           version: "1.17.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.0/wire-service.json",
    //         },
    //         {
    //           version: "1.17.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.1/wire-service.json",
    //         },
    //         {
    //           version: "1.17.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.2/wire-service.json",
    //         },
    //         {
    //           version: "1.17.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.3/wire-service.json",
    //         },
    //         {
    //           version: "1.17.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.4/wire-service.json",
    //         },
    //         {
    //           version: "1.17.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.5/wire-service.json",
    //         },
    //         {
    //           version: "1.17.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.6/wire-service.json",
    //         },
    //         {
    //           version: "1.17.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.8/wire-service.json",
    //         },
    //         {
    //           version: "1.17.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.9/wire-service.json",
    //         },
    //         {
    //           version: "1.18.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.18.0/wire-service.json",
    //         },
    //         {
    //           version: "2.0.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.0.0/wire-service.json",
    //         },
    //         {
    //           version: "2.1.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.1.0/wire-service.json",
    //         },
    //         {
    //           version: "2.1.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.1.1/wire-service.json",
    //         },
    //         {
    //           version: "2.1.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.1.2/wire-service.json",
    //         },
    //         {
    //           version: "2.2.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.0/wire-service.json",
    //         },
    //         {
    //           version: "2.2.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.1/wire-service.json",
    //         },
    //         {
    //           version: "2.2.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.2/wire-service.json",
    //         },
    //         {
    //           version: "2.2.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.3/wire-service.json",
    //         },
    //         {
    //           version: "2.2.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.4/wire-service.json",
    //         },
    //         {
    //           version: "2.2.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.5/wire-service.json",
    //         },
    //         {
    //           version: "2.2.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.6/wire-service.json",
    //         },
    //         {
    //           version: "2.2.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.7/wire-service.json",
    //         },
    //         {
    //           version: "2.2.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.8/wire-service.json",
    //         },
    //         {
    //           version: "2.2.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.9/wire-service.json",
    //         },
    //         {
    //           version: "2.2.10-234.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.10-234.0/wire-service.json",
    //         },
    //         {
    //           version: "2.2.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.11/wire-service.json",
    //         },
    //         {
    //           version: "2.2.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.12/wire-service.json",
    //         },
    //         {
    //           version: "2.3.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.0/wire-service.json",
    //         },
    //         {
    //           version: "2.3.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.1/wire-service.json",
    //         },
    //         {
    //           version: "2.3.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.2/wire-service.json",
    //         },
    //         {
    //           version: "2.3.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.3/wire-service.json",
    //         },
    //         {
    //           version: "2.3.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.4/wire-service.json",
    //         },
    //         {
    //           version: "2.3.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.7/wire-service.json",
    //         },
    //         {
    //           version: "2.4.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.4.0/wire-service.json",
    //         },
    //         {
    //           version: "2.5.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.0/wire-service.json",
    //         },
    //         {
    //           version: "2.5.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.1/wire-service.json",
    //         },
    //         {
    //           version: "2.5.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.2/wire-service.json",
    //         },
    //         {
    //           version: "2.5.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.3/wire-service.json",
    //         },
    //         {
    //           version: "2.5.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.4/wire-service.json",
    //         },
    //         {
    //           version: "2.5.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.6/wire-service.json",
    //         },
    //         {
    //           version: "2.5.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.7/wire-service.json",
    //         },
    //         {
    //           version: "2.5.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.8/wire-service.json",
    //         },
    //         {
    //           version: "2.5.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.9/wire-service.json",
    //         },
    //         {
    //           version: "2.5.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.10/wire-service.json",
    //         },
    //         {
    //           version: "2.5.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.11/wire-service.json",
    //         },
    //         {
    //           version: "2.5.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.12/wire-service.json",
    //         },
    //         {
    //           version: "2.5.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.13/wire-service.json",
    //         },
    //         {
    //           version: "2.6.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.6.0/wire-service.json",
    //         },
    //         {
    //           version: "2.6.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.6.1/wire-service.json",
    //         },
    //         {
    //           version: "2.6.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.6.2/wire-service.json",
    //         },
    //         {
    //           version: "2.6.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.6.3/wire-service.json",
    //         },
    //         {
    //           version: "2.7.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.7.0/wire-service.json",
    //         },
    //         {
    //           version: "2.7.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.7.1/wire-service.json",
    //         },
    //         {
    //           version: "2.7.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.7.2/wire-service.json",
    //         },
    //         {
    //           version: "2.7.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.7.3/wire-service.json",
    //         },
    //         {
    //           version: "2.7.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.7.4/wire-service.json",
    //         },
    //         {
    //           version: "2.8.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.8.0/wire-service.json",
    //         },
    //         {
    //           version: "2.9.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.9.0/wire-service.json",
    //         },
    //         {
    //           version: "2.10.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.10.0/wire-service.json",
    //         },
    //         {
    //           version: "2.11.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.0/wire-service.json",
    //         },
    //         {
    //           version: "2.11.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.1/wire-service.json",
    //         },
    //         {
    //           version: "2.11.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.3/wire-service.json",
    //         },
    //         {
    //           version: "2.11.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.4/wire-service.json",
    //         },
    //         {
    //           version: "2.11.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.5/wire-service.json",
    //         },
    //         {
    //           version: "2.11.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.6/wire-service.json",
    //         },
    //         {
    //           version: "2.11.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.7/wire-service.json",
    //         },
    //         {
    //           version: "2.11.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.8/wire-service.json",
    //         },
    //         {
    //           version: "2.12.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.12.0/wire-service.json",
    //         },
    //         {
    //           version: "2.12.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.12.1/wire-service.json",
    //         },
    //         {
    //           version: "2.13.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.13.0/wire-service.json",
    //         },
    //         {
    //           version: "2.13.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.13.1/wire-service.json",
    //         },
    //         {
    //           version: "2.13.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.13.2/wire-service.json",
    //         },
    //         {
    //           version: "2.13.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.13.3/wire-service.json",
    //         },
    //         {
    //           version: "2.13.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.13.4/wire-service.json",
    //         },
    //         {
    //           version: "2.14.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.14.0/wire-service.json",
    //         },
    //         {
    //           version: "2.14.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.14.1/wire-service.json",
    //         },
    //         {
    //           version: "2.14.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.14.2/wire-service.json",
    //         },
    //         {
    //           version: "2.15.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.15.0/wire-service.json",
    //         },
    //         {
    //           version: "2.16.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.16.0/wire-service.json",
    //         },
    //         {
    //           version: "2.17.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.17.0/wire-service.json",
    //         },
    //         {
    //           version: "2.18.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.18.0/wire-service.json",
    //         },
    //         {
    //           version: "2.19.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.19.0/wire-service.json",
    //         },
    //         {
    //           version: "2.19.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.19.1/wire-service.json",
    //         },
    //         {
    //           version: "2.20.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.0/wire-service.json",
    //         },
    //         {
    //           version: "2.20.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.1/wire-service.json",
    //         },
    //         {
    //           version: "2.20.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.2/wire-service.json",
    //         },
    //         {
    //           version: "2.20.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.3/wire-service.json",
    //         },
    //         {
    //           version: "2.20.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.4/wire-service.json",
    //         },
    //         {
    //           version: "2.20.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.5/wire-service.json",
    //         },
    //         {
    //           version: "2.20.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.6/wire-service.json",
    //         },
    //         {
    //           version: "2.20.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.7/wire-service.json",
    //         },
    //         {
    //           version: "2.21.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.21.0/wire-service.json",
    //         },
    //         {
    //           version: "2.21.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.21.1/wire-service.json",
    //         },
    //         {
    //           version: "2.22.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.22.0/wire-service.json",
    //         },
    //         {
    //           version: "2.23.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.0/wire-service.json",
    //         },
    //         {
    //           version: "2.23.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.1/wire-service.json",
    //         },
    //         {
    //           version: "2.23.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.2/wire-service.json",
    //         },
    //         {
    //           version: "2.23.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.3/wire-service.json",
    //         },
    //         {
    //           version: "2.23.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.4/wire-service.json",
    //         },
    //         {
    //           version: "2.23.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.5/wire-service.json",
    //         },
    //         {
    //           version: "2.23.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.6/wire-service.json",
    //         },
    //         {
    //           version: "2.24.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.24.0/wire-service.json",
    //         },
    //         {
    //           version: "2.25.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.25.0/wire-service.json",
    //         },
    //         {
    //           version: "2.25.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.25.1/wire-service.json",
    //         },
    //         {
    //           version: "2.26.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.26.0/wire-service.json",
    //         },
    //         {
    //           version: "2.26.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.26.1/wire-service.json",
    //         },
    //         {
    //           version: "2.26.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.26.2/wire-service.json",
    //         },
    //         {
    //           version: "2.27.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.27.0/wire-service.json",
    //         },
    //         {
    //           version: "2.28.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.28.0/wire-service.json",
    //         },
    //         {
    //           version: "2.28.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.28.1/wire-service.json",
    //         },
    //         {
    //           version: "2.29.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.29.0/wire-service.json",
    //         },
    //         {
    //           version: "2.30.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.30.0/wire-service.json",
    //         },
    //         {
    //           version: "2.30.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.30.1/wire-service.json",
    //         },
    //         {
    //           version: "2.30.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.30.2/wire-service.json",
    //         },
    //         {
    //           version: "2.30.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.30.3/wire-service.json",
    //         },
    //         {
    //           version: "2.31.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.0/wire-service.json",
    //         },
    //         {
    //           version: "2.31.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.1/wire-service.json",
    //         },
    //         {
    //           version: "2.31.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.2/wire-service.json",
    //         },
    //         {
    //           version: "2.31.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.3/wire-service.json",
    //         },
    //         {
    //           version: "2.31.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.4/wire-service.json",
    //         },
    //         {
    //           version: "2.31.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.5/wire-service.json",
    //         },
    //         {
    //           version: "2.31.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.6/wire-service.json",
    //         },
    //         {
    //           version: "2.31.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.7/wire-service.json",
    //         },
    //         {
    //           version: "2.31.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.8/wire-service.json",
    //         },
    //         {
    //           version: "2.32.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.32.0/wire-service.json",
    //         },
    //         {
    //           version: "2.32.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.32.1/wire-service.json",
    //         },
    //         {
    //           version: "2.33.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.33.0/wire-service.json",
    //         },
    //         {
    //           version: "2.34.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.34.0/wire-service.json",
    //         },
    //         {
    //           version: "2.35.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.35.0/wire-service.json",
    //         },
    //         {
    //           version: "2.35.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.35.1/wire-service.json",
    //         },
    //         {
    //           version: "2.35.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.35.2/wire-service.json",
    //         },
    //         {
    //           version: "2.36.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.36.0/wire-service.json",
    //         },
    //         {
    //           version: "2.37.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.37.0/wire-service.json",
    //         },
    //         {
    //           version: "2.37.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.37.1/wire-service.json",
    //         },
    //         {
    //           version: "2.37.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.37.2/wire-service.json",
    //         },
    //         {
    //           version: "2.37.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.37.3/wire-service.json",
    //         },
    //         {
    //           version: "2.38.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.38.0/wire-service.json",
    //         },
    //         {
    //           version: "2.38.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.38.1/wire-service.json",
    //         },
    //         {
    //           version: "2.39.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.39.0/wire-service.json",
    //         },
    //         {
    //           version: "2.39.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.39.1/wire-service.json",
    //         },
    //         {
    //           version: "2.40.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.40.0/wire-service.json",
    //         },
    //         {
    //           version: "2.40.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.40.1/wire-service.json",
    //         },
    //         {
    //           version: "2.41.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.41.0/wire-service.json",
    //         },
    //         {
    //           version: "2.41.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.41.1/wire-service.json",
    //         },
    //         {
    //           version: "2.41.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.41.2/wire-service.json",
    //         },
    //         {
    //           version: "2.41.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.41.3/wire-service.json",
    //         },
    //         {
    //           version: "2.41.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.41.4/wire-service.json",
    //         },
    //         {
    //           version: "2.42.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.42.0/wire-service.json",
    //         },
    //         {
    //           version: "2.43.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.43.0/wire-service.json",
    //         },
    //         {
    //           version: "2.44.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.44.0/wire-service.json",
    //         },
    //         {
    //           version: "2.45.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.0/wire-service.json",
    //         },
    //         {
    //           version: "2.45.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.1/wire-service.json",
    //         },
    //         {
    //           version: "2.45.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.2/wire-service.json",
    //         },
    //         {
    //           version: "2.45.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.3/wire-service.json",
    //         },
    //         {
    //           version: "2.45.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.4/wire-service.json",
    //         },
    //         {
    //           version: "2.45.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.5/wire-service.json",
    //         },
    //         {
    //           version: "2.46.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.46.0/wire-service.json",
    //         },
    //         {
    //           version: "2.47.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.47.0/wire-service.json",
    //         },
    //         {
    //           version: "2.48.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.48.0/wire-service.json",
    //         },
    //         {
    //           version: "2.49.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.49.0/wire-service.json",
    //         },
    //         {
    //           version: "2.49.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.49.1/wire-service.json",
    //         },
    //       ],
    //       tags: {
    //         next: "2.2.1",
    //         latest: "2.49.1",
    //         canary: "2.11.3-238prod.0",
    //         spring20: "1.1.13-224.8",
    //         winter20: "1.0.2-222.26",
    //         summer20: "1.3.7-226.7",
    //         spring19: "0.34.7",
    //         summer19: "0.37.4-220.2",
    //         winter19: "0.40.1-222.1",
    //         winter21: "1.7.10-228.5",
    //         spring21: "1.9.3-230.1",
    //         summer21: "1.17.9",
    //         winter22: "2.2.12",
    //         spring22: "2.5.13",
    //         "backport-2.6": "2.6.3",
    //         summer22: "2.11.8",
    //         winter23: "2.20.7",
    //         spring23: "2.31.8",
    //         "lbc-avante-garde": "2.40.2-lbc",
    //       },
    //       stable: "1.7.10-228.5",
    //     },
    //     "lwc-synthetic-shadow": {
    //       versions: [
    //         {
    //           version: "0.38.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.38.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.38.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.38.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.38.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.38.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.39.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.39.1-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.1-222.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.39.1-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.1-222.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.39.1-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.1-222.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.39.1-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.1-222.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.39.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.40.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.40.1-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.40.1-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.40.1-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.40.1-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.40.1-222.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.40.1-222.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.40.1-222.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.40.1-222.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.40.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.41.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.41.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.228.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.228.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.228.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.228.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "0.228.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.228.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.9/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.10/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.11/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.12/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.13/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.14/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.15",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.15/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.16",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.16/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.17",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.17/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.18",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.18/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.19",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.19/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.20",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.20/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.21",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.21/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.22",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.22/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.23",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.23/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.24",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.24/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.25",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.25/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.26",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.26/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2-222.1000",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.1000/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.0.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.9/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.10/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.11/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.12/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.13-224.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.13-224.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.13-224.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.13-224.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.13-224.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.13-224.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.13-224.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.13-224.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.14/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.15",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.15/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.1.16",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.16/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.2.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.2.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.2.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.2.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.2.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.2.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-226.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-226.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-226.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-226.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-226.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-226.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-226.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-226.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-228.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-228.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-228.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-228.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-228.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-228.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7-228.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-228.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.9/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.10/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.11/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.3.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.12/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.4.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.4.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.5.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.5.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.5.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.5.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.5.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.5.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.5.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.5.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.5.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.5.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.6.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.6.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.6.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.6.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.6.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.6.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.6.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.6.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.6.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.6.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.9/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.9/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.10-228.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10-228.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.10-228.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10-228.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.10-228.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10-228.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.10-228.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10-228.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.10-228.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10-228.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.11/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.12/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.13/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.7.14",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.14/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.8.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.8.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.8.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.8.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.8.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.8.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.8.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.8.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.9.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.9.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.9.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.9.3-230.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.3-230.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.9.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.9.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.9.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.9.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.9.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.9.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.10.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.10.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.10.1-232.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.10.1-232.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.10.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.10.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.11.0-232.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.0-232.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.11.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.11.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.11.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.11.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.11.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.16.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.16.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.17.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.17.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.17.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.17.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.17.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.17.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.17.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.17.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.9/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "1.18.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.18.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.0.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.0.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.1.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.1.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.1.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.1.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.1.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.1.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.9/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.10-234.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.10-234.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.11/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.2.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.12/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.3.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.3.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.3.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.3.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.3.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.3.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.4.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.4.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.9",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.9/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.10",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.10/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.11",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.11/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.12",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.12/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.5.13",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.13/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.6.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.6.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.6.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.6.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.6.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.6.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.6.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.6.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.7.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.7.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.7.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.7.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.7.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.7.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.7.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.7.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.7.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.7.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.8.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.8.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.9.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.9.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.10.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.10.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.11.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.11.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.11.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.11.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.11.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.11.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.11.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.11.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.12.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.12.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.12.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.12.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.13.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.13.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.13.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.13.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.13.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.13.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.13.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.13.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.13.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.13.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.14.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.14.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.14.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.14.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.14.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.14.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.15.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.15.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.16.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.16.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.17.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.17.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.18.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.18.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.19.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.19.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.19.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.19.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.20.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.20.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.20.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.20.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.20.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.20.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.20.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.20.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.21.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.21.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.21.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.21.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.22.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.22.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.23.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.23.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.23.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.23.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.23.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.23.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.23.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.24.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.24.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.25.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.25.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.25.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.25.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.26.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.26.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.26.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.26.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.26.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.26.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.27.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.27.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.28.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.28.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.28.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.28.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.29.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.29.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.30.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.30.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.30.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.30.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.30.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.30.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.30.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.30.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.31.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.31.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.31.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.31.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.31.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.31.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.31.6",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.6/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.31.7",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.7/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.31.8",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.8/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.32.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.32.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.32.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.32.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.33.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.33.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.34.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.34.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.35.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.35.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.35.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.35.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.35.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.35.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.36.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.36.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.37.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.37.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.37.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.37.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.37.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.37.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.37.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.37.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.38.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.38.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.38.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.38.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.39.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.39.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.39.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.39.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.40.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.40.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.40.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.40.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.41.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.41.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.41.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.41.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.41.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.41.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.41.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.41.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.41.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.41.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.42.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.42.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.43.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.43.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.44.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.44.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.45.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.45.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.1/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.45.2",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.2/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.45.3",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.3/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.45.4",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.4/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.45.5",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.5/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.46.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.46.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.47.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.47.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.48.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.48.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.49.0",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.49.0/lwc-synthetic-shadow.json",
    //         },
    //         {
    //           version: "2.49.1",
    //           url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.49.1/lwc-synthetic-shadow.json",
    //         },
    //       ],
    //       tags: {
    //         canary: "2.11.3-238prod.0",
    //         latest: "2.49.1",
    //         next: "2.2.1",
    //         spring20: "1.1.13-224.8",
    //         winter20: "1.0.2-222.26",
    //         summer20: "1.3.7-226.7",
    //         winter19: "0.40.1-222.1",
    //         winter21: "1.7.10-228.5",
    //         spring21: "1.9.3-230.1",
    //         summer21: "1.17.9",
    //         winter22: "2.2.12",
    //         spring22: "2.5.13",
    //         "backport-2.6": "2.6.3",
    //         summer22: "2.11.8",
    //         winter23: "2.20.7",
    //         spring23: "2.31.8",
    //         "lbc-avante-garde": "2.40.2-lbc",
    //       },
    //       stable: "1.7.10-228.5",
    //     },
    //     CONTAINER_URL:
    //       "https://developer.salesforce.com/docs/component-library/tools/playground",
    //     APP_SLDS_VERSION: "2.8.3",
    //   },
    // };
    // return template;
    const {
      namespace = "c",
      minify = false,
      compat = false,
      description = "",
    } = options;

    const fileEntries = {};
    let fileCounter = 0;

    // Create root directory
    fileEntries["<root>"] = {
      type: "directory",
      id: "<root>",
      name: "root",
      path: "root",
      childIds: ["comp-dir"],
      opened: true,
    };

    // Create component directory
    const childIds = [];
    fileEntries["comp-dir"] = {
      type: "directory",
      id: "comp-dir",
      name: componentName,
      path: `root/${componentName}`,
      childIds: childIds,
      opened: true,
    };

    // Add files
    Object.entries(files).forEach(([filename, content]) => {
      const fileId = `file-${fileCounter++}`;
      childIds.push(fileId);

      fileEntries[fileId] = {
        type: "file",
        id: fileId,
        name: filename,
        path: `root/${componentName}/${filename}`,
        content: content,
        childIds: [],
        opened: false,
      };
    });
    console.log(fileEntries);
    return {
      files: fileEntries,
      project: {
        name: componentName,
        description: description,
        namespace: namespace,
        minify: minify,
        compat: compat,
        mainModule: componentName,
        alias: undefined,
        compileonchange: true,
        compiled: undefined,
        compiledComponentsVersion: undefined,
        compiledVersion: undefined,
        componentsVersion: undefined,
        isLoading: false,
        lwcVersion: undefined,
        nativeShadow: undefined,
        savefailed: false,
        sldsVersion: undefined,
        template: undefined,
        version: undefined,
      },

      runtime: {
        lwc: {
          versions: [
            {
              version: "1.6.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.6.0/lwc-compiler.js",
            },
          ],
          stable: "1.6.0",
        },
        engine: {
          versions: [
            {
              version: "1.7.10-228.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.7.10-228.5/engine.js",
            },
            {
              version: "1.6.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc/1.6.0/engine.js",
            },
          ],
          tags: {
            next: "1.18.0",
            latest: "1.17.6",
            canary: "1.18.0-alpha.3",
            spring20: "1.1.13-224.8",
            winter20: "1.0.2-222.26",
            summer20: "1.3.7-226.7",
            spring19: "0.34.7",
            summer19: "0.37.4-220.2",
            winter19: "0.40.1-222.1",
            winter21: "1.7.10-228.5",
            spring21: "1.9.3-230.1",
            summer21: "1.17.9",
          },
          stable: "1.6.0",
        },
        components: {
          versions: [
            {
              version: "1.4.4-alpha",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-components/1.4.4-alpha/lwc-components-lightning.json",
            },
            {
              version: "1.8.6-alpha",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-components/1.8.6-alpha/lwc-components-lightning.json",
            },
            {
              version: "1.10.8-alpha",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-components/1.10.8-alpha/lwc-components-lightning.json",
            },
            {
              version: "1.11.3-alpha",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-components/1.11.3-alpha/lwc-components-lightning.json",
            },
          ],
          tags: {
            "228-patch": "1.8.6-alpha",
            "230-patch": "1.10.8-alpha",
            latest: "1.11.3-alpha",
            main: "1.4.4-alpha",
          },
          stable: "1.8.6-alpha",
        },
        slds: {
          versions: [
            {
              version: "2.18.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.18.0",
            },
            {
              version: "2.18.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.18.1",
            },
            {
              version: "2.19.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.19.0",
            },
            {
              version: "2.20.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.20.0",
            },
            {
              version: "2.20.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.20.1",
            },
            {
              version: "2.21.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.21.0",
            },
            {
              version: "2.21.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/slds/2.21.1",
            },
          ],
          tags: {
            latest: "2.21.1",
            lwc: "3.0.0-alpha.12",
            "winter-19": "2.7.5",
            "spring-19": "2.8.3",
            "summer-18": "2.6.2",
            "summer-19": "2.9.5",
            "winter-20": "2.10.2",
            "spring-20": "2.11.9",
            "summer-20": "2.12.2",
            "winter-21": "2.13.7",
            "spring-21": "2.14.3",
            "summer-21": "2.15.9",
            main: "2.22.0-alpha.2",
            "winter-22": "2.16.2",
            "spring-22": "2.17.5",
            "summer-22": "2.18.1",
            "winter-23": "2.19.0",
            "spring-23": "2.20.1",
            "summer-23": "2.21.1",
            "winter-24": "2.22.0-alpha.2",
          },
          stable: "2.13.7",
        },
        showVersions: false,
        standalone: true,
        isLoading: false,
        isLoaded: true,
        "wire-service": {
          versions: [
            {
              version: "1.7.10",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.10/wire-service.json",
            },
            {
              version: "1.7.11",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.11/wire-service.json",
            },
            {
              version: "1.7.12",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.12/wire-service.json",
            },
            {
              version: "1.7.13",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.13/wire-service.json",
            },
            {
              version: "1.7.14",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.7.14/wire-service.json",
            },
            {
              version: "1.8.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.0/wire-service.json",
            },
            {
              version: "1.8.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.1/wire-service.json",
            },
            {
              version: "1.8.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.2/wire-service.json",
            },
            {
              version: "1.8.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.3/wire-service.json",
            },
            {
              version: "1.8.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.4/wire-service.json",
            },
            {
              version: "1.8.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.5/wire-service.json",
            },
            {
              version: "1.8.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.6/wire-service.json",
            },
            {
              version: "1.8.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.8.7/wire-service.json",
            },
            {
              version: "1.9.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.0/wire-service.json",
            },
            {
              version: "1.9.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.1/wire-service.json",
            },
            {
              version: "1.9.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.2/wire-service.json",
            },
            {
              version: "1.9.3-230.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.3-230.1/wire-service.json",
            },
            {
              version: "1.9.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.3/wire-service.json",
            },
            {
              version: "1.9.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.4/wire-service.json",
            },
            {
              version: "1.9.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.5/wire-service.json",
            },
            {
              version: "1.9.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.6/wire-service.json",
            },
            {
              version: "1.9.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.7/wire-service.json",
            },
            {
              version: "1.9.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.9.8/wire-service.json",
            },
            {
              version: "1.10.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.10.0/wire-service.json",
            },
            {
              version: "1.10.1-232.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.10.1-232.1/wire-service.json",
            },
            {
              version: "1.10.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.10.1/wire-service.json",
            },
            {
              version: "1.11.0-232.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.0-232.1/wire-service.json",
            },
            {
              version: "1.11.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.0/wire-service.json",
            },
            {
              version: "1.11.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.1/wire-service.json",
            },
            {
              version: "1.11.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.2/wire-service.json",
            },
            {
              version: "1.11.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.3/wire-service.json",
            },
            {
              version: "1.11.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.11.4/wire-service.json",
            },
            {
              version: "1.16.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.16.4/wire-service.json",
            },
            {
              version: "1.17.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.0/wire-service.json",
            },
            {
              version: "1.17.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.1/wire-service.json",
            },
            {
              version: "1.17.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.2/wire-service.json",
            },
            {
              version: "1.17.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.3/wire-service.json",
            },
            {
              version: "1.17.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.4/wire-service.json",
            },
            {
              version: "1.17.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.5/wire-service.json",
            },
            {
              version: "1.17.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.6/wire-service.json",
            },
            {
              version: "1.17.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.8/wire-service.json",
            },
            {
              version: "1.17.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.17.9/wire-service.json",
            },
            {
              version: "1.18.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/1.18.0/wire-service.json",
            },
            {
              version: "2.0.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.0.0/wire-service.json",
            },
            {
              version: "2.1.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.1.0/wire-service.json",
            },
            {
              version: "2.1.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.1.1/wire-service.json",
            },
            {
              version: "2.1.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.1.2/wire-service.json",
            },
            {
              version: "2.2.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.0/wire-service.json",
            },
            {
              version: "2.2.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.1/wire-service.json",
            },
            {
              version: "2.2.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.2/wire-service.json",
            },
            {
              version: "2.2.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.3/wire-service.json",
            },
            {
              version: "2.2.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.4/wire-service.json",
            },
            {
              version: "2.2.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.5/wire-service.json",
            },
            {
              version: "2.2.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.6/wire-service.json",
            },
            {
              version: "2.2.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.7/wire-service.json",
            },
            {
              version: "2.2.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.8/wire-service.json",
            },
            {
              version: "2.2.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.9/wire-service.json",
            },
            {
              version: "2.2.10-234.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.10-234.0/wire-service.json",
            },
            {
              version: "2.2.11",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.11/wire-service.json",
            },
            {
              version: "2.2.12",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.2.12/wire-service.json",
            },
            {
              version: "2.3.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.0/wire-service.json",
            },
            {
              version: "2.3.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.1/wire-service.json",
            },
            {
              version: "2.3.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.2/wire-service.json",
            },
            {
              version: "2.3.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.3/wire-service.json",
            },
            {
              version: "2.3.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.4/wire-service.json",
            },
            {
              version: "2.3.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.3.7/wire-service.json",
            },
            {
              version: "2.4.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.4.0/wire-service.json",
            },
            {
              version: "2.5.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.0/wire-service.json",
            },
            {
              version: "2.5.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.1/wire-service.json",
            },
            {
              version: "2.5.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.2/wire-service.json",
            },
            {
              version: "2.5.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.3/wire-service.json",
            },
            {
              version: "2.5.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.4/wire-service.json",
            },
            {
              version: "2.5.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.6/wire-service.json",
            },
            {
              version: "2.5.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.7/wire-service.json",
            },
            {
              version: "2.5.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.8/wire-service.json",
            },
            {
              version: "2.5.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.9/wire-service.json",
            },
            {
              version: "2.5.10",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.10/wire-service.json",
            },
            {
              version: "2.5.11",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.11/wire-service.json",
            },
            {
              version: "2.5.12",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.12/wire-service.json",
            },
            {
              version: "2.5.13",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.5.13/wire-service.json",
            },
            {
              version: "2.6.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.6.0/wire-service.json",
            },
            {
              version: "2.6.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.6.1/wire-service.json",
            },
            {
              version: "2.6.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.6.2/wire-service.json",
            },
            {
              version: "2.6.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.6.3/wire-service.json",
            },
            {
              version: "2.7.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.7.0/wire-service.json",
            },
            {
              version: "2.7.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.7.1/wire-service.json",
            },
            {
              version: "2.7.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.7.2/wire-service.json",
            },
            {
              version: "2.7.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.7.3/wire-service.json",
            },
            {
              version: "2.7.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.7.4/wire-service.json",
            },
            {
              version: "2.8.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.8.0/wire-service.json",
            },
            {
              version: "2.9.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.9.0/wire-service.json",
            },
            {
              version: "2.10.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.10.0/wire-service.json",
            },
            {
              version: "2.11.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.0/wire-service.json",
            },
            {
              version: "2.11.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.1/wire-service.json",
            },
            {
              version: "2.11.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.3/wire-service.json",
            },
            {
              version: "2.11.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.4/wire-service.json",
            },
            {
              version: "2.11.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.5/wire-service.json",
            },
            {
              version: "2.11.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.6/wire-service.json",
            },
            {
              version: "2.11.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.7/wire-service.json",
            },
            {
              version: "2.11.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.11.8/wire-service.json",
            },
            {
              version: "2.12.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.12.0/wire-service.json",
            },
            {
              version: "2.12.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.12.1/wire-service.json",
            },
            {
              version: "2.13.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.13.0/wire-service.json",
            },
            {
              version: "2.13.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.13.1/wire-service.json",
            },
            {
              version: "2.13.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.13.2/wire-service.json",
            },
            {
              version: "2.13.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.13.3/wire-service.json",
            },
            {
              version: "2.13.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.13.4/wire-service.json",
            },
            {
              version: "2.14.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.14.0/wire-service.json",
            },
            {
              version: "2.14.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.14.1/wire-service.json",
            },
            {
              version: "2.14.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.14.2/wire-service.json",
            },
            {
              version: "2.15.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.15.0/wire-service.json",
            },
            {
              version: "2.16.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.16.0/wire-service.json",
            },
            {
              version: "2.17.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.17.0/wire-service.json",
            },
            {
              version: "2.18.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.18.0/wire-service.json",
            },
            {
              version: "2.19.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.19.0/wire-service.json",
            },
            {
              version: "2.19.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.19.1/wire-service.json",
            },
            {
              version: "2.20.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.0/wire-service.json",
            },
            {
              version: "2.20.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.1/wire-service.json",
            },
            {
              version: "2.20.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.2/wire-service.json",
            },
            {
              version: "2.20.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.3/wire-service.json",
            },
            {
              version: "2.20.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.4/wire-service.json",
            },
            {
              version: "2.20.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.5/wire-service.json",
            },
            {
              version: "2.20.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.6/wire-service.json",
            },
            {
              version: "2.20.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.20.7/wire-service.json",
            },
            {
              version: "2.21.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.21.0/wire-service.json",
            },
            {
              version: "2.21.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.21.1/wire-service.json",
            },
            {
              version: "2.22.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.22.0/wire-service.json",
            },
            {
              version: "2.23.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.0/wire-service.json",
            },
            {
              version: "2.23.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.1/wire-service.json",
            },
            {
              version: "2.23.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.2/wire-service.json",
            },
            {
              version: "2.23.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.3/wire-service.json",
            },
            {
              version: "2.23.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.4/wire-service.json",
            },
            {
              version: "2.23.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.5/wire-service.json",
            },
            {
              version: "2.23.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.23.6/wire-service.json",
            },
            {
              version: "2.24.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.24.0/wire-service.json",
            },
            {
              version: "2.25.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.25.0/wire-service.json",
            },
            {
              version: "2.25.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.25.1/wire-service.json",
            },
            {
              version: "2.26.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.26.0/wire-service.json",
            },
            {
              version: "2.26.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.26.1/wire-service.json",
            },
            {
              version: "2.26.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.26.2/wire-service.json",
            },
            {
              version: "2.27.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.27.0/wire-service.json",
            },
            {
              version: "2.28.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.28.0/wire-service.json",
            },
            {
              version: "2.28.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.28.1/wire-service.json",
            },
            {
              version: "2.29.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.29.0/wire-service.json",
            },
            {
              version: "2.30.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.30.0/wire-service.json",
            },
            {
              version: "2.30.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.30.1/wire-service.json",
            },
            {
              version: "2.30.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.30.2/wire-service.json",
            },
            {
              version: "2.30.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.30.3/wire-service.json",
            },
            {
              version: "2.31.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.0/wire-service.json",
            },
            {
              version: "2.31.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.1/wire-service.json",
            },
            {
              version: "2.31.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.2/wire-service.json",
            },
            {
              version: "2.31.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.3/wire-service.json",
            },
            {
              version: "2.31.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.4/wire-service.json",
            },
            {
              version: "2.31.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.5/wire-service.json",
            },
            {
              version: "2.31.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.6/wire-service.json",
            },
            {
              version: "2.31.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.7/wire-service.json",
            },
            {
              version: "2.31.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.31.8/wire-service.json",
            },
            {
              version: "2.32.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.32.0/wire-service.json",
            },
            {
              version: "2.32.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.32.1/wire-service.json",
            },
            {
              version: "2.33.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.33.0/wire-service.json",
            },
            {
              version: "2.34.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.34.0/wire-service.json",
            },
            {
              version: "2.35.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.35.0/wire-service.json",
            },
            {
              version: "2.35.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.35.1/wire-service.json",
            },
            {
              version: "2.35.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.35.2/wire-service.json",
            },
            {
              version: "2.36.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.36.0/wire-service.json",
            },
            {
              version: "2.37.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.37.0/wire-service.json",
            },
            {
              version: "2.37.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.37.1/wire-service.json",
            },
            {
              version: "2.37.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.37.2/wire-service.json",
            },
            {
              version: "2.37.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.37.3/wire-service.json",
            },
            {
              version: "2.38.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.38.0/wire-service.json",
            },
            {
              version: "2.38.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.38.1/wire-service.json",
            },
            {
              version: "2.39.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.39.0/wire-service.json",
            },
            {
              version: "2.39.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.39.1/wire-service.json",
            },
            {
              version: "2.40.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.40.0/wire-service.json",
            },
            {
              version: "2.40.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.40.1/wire-service.json",
            },
            {
              version: "2.41.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.41.0/wire-service.json",
            },
            {
              version: "2.41.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.41.1/wire-service.json",
            },
            {
              version: "2.41.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.41.2/wire-service.json",
            },
            {
              version: "2.41.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.41.3/wire-service.json",
            },
            {
              version: "2.41.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.41.4/wire-service.json",
            },
            {
              version: "2.42.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.42.0/wire-service.json",
            },
            {
              version: "2.43.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.43.0/wire-service.json",
            },
            {
              version: "2.44.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.44.0/wire-service.json",
            },
            {
              version: "2.45.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.0/wire-service.json",
            },
            {
              version: "2.45.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.1/wire-service.json",
            },
            {
              version: "2.45.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.2/wire-service.json",
            },
            {
              version: "2.45.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.3/wire-service.json",
            },
            {
              version: "2.45.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.4/wire-service.json",
            },
            {
              version: "2.45.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.45.5/wire-service.json",
            },
            {
              version: "2.46.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.46.0/wire-service.json",
            },
            {
              version: "2.47.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.47.0/wire-service.json",
            },
            {
              version: "2.48.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.48.0/wire-service.json",
            },
            {
              version: "2.49.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.49.0/wire-service.json",
            },
            {
              version: "2.49.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/wire-service/2.49.1/wire-service.json",
            },
          ],
          tags: {
            next: "2.2.1",
            latest: "2.49.1",
            canary: "2.11.3-238prod.0",
            spring20: "1.1.13-224.8",
            winter20: "1.0.2-222.26",
            summer20: "1.3.7-226.7",
            spring19: "0.34.7",
            summer19: "0.37.4-220.2",
            winter19: "0.40.1-222.1",
            winter21: "1.7.10-228.5",
            spring21: "1.9.3-230.1",
            summer21: "1.17.9",
            winter22: "2.2.12",
            spring22: "2.5.13",
            "backport-2.6": "2.6.3",
            summer22: "2.11.8",
            winter23: "2.20.7",
            spring23: "2.31.8",
            "lbc-avante-garde": "2.40.2-lbc",
          },
          stable: "2.49.1",
        },
        "lwc-synthetic-shadow": {
          versions: [
            {
              version: "0.38.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.38.0/lwc-synthetic-shadow.json",
            },
            {
              version: "0.38.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.38.1/lwc-synthetic-shadow.json",
            },
            {
              version: "0.38.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.38.2/lwc-synthetic-shadow.json",
            },
            {
              version: "0.39.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.0/lwc-synthetic-shadow.json",
            },
            {
              version: "0.39.1-222.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.1-222.1/lwc-synthetic-shadow.json",
            },
            {
              version: "0.39.1-222.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.1-222.2/lwc-synthetic-shadow.json",
            },
            {
              version: "0.39.1-222.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.1-222.3/lwc-synthetic-shadow.json",
            },
            {
              version: "0.39.1-222.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.1-222.4/lwc-synthetic-shadow.json",
            },
            {
              version: "0.39.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.39.1/lwc-synthetic-shadow.json",
            },
            {
              version: "0.40.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.0/lwc-synthetic-shadow.json",
            },
            {
              version: "0.40.1-222.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.1/lwc-synthetic-shadow.json",
            },
            {
              version: "0.40.1-222.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.2/lwc-synthetic-shadow.json",
            },
            {
              version: "0.40.1-222.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.3/lwc-synthetic-shadow.json",
            },
            {
              version: "0.40.1-222.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.4/lwc-synthetic-shadow.json",
            },
            {
              version: "0.40.1-222.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.5/lwc-synthetic-shadow.json",
            },
            {
              version: "0.40.1-222.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.6/lwc-synthetic-shadow.json",
            },
            {
              version: "0.40.1-222.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.7/lwc-synthetic-shadow.json",
            },
            {
              version: "0.40.1-222.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1-222.8/lwc-synthetic-shadow.json",
            },
            {
              version: "0.40.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.40.1/lwc-synthetic-shadow.json",
            },
            {
              version: "0.41.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.41.0/lwc-synthetic-shadow.json",
            },
            {
              version: "0.228.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.228.5/lwc-synthetic-shadow.json",
            },
            {
              version: "0.228.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.228.6/lwc-synthetic-shadow.json",
            },
            {
              version: "0.228.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/0.228.7/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.6/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.7/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.8/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.9/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.10",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.10/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.11",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.11/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.12",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.12/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.13",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.13/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.14",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.14/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.15",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.15/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.16",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.16/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.17",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.17/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.18",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.18/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.19",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.19/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.20",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.20/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.21",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.21/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.22",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.22/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.23",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.23/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.24",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.24/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.25",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.25/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.26",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.26/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2-222.1000",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2-222.1000/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.0.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.0.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.6/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.7/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.8/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.9/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.10",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.10/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.11",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.11/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.12",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.12/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.13-224.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.13-224.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.13-224.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.13-224.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.13-224.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.13-224.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.6/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.13-224.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.7/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.13-224.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13-224.8/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.13",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.13/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.14",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.14/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.15",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.15/lwc-synthetic-shadow.json",
            },
            {
              version: "1.1.16",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.1.16/lwc-synthetic-shadow.json",
            },
            {
              version: "1.2.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.2.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.2.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.2.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.2.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.2.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.2.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.6/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-226.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-226.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-226.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-226.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-226.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-226.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-226.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.6/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-226.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-226.7/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-228.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-228.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-228.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-228.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-228.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-228.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7-228.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7-228.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.7/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.8/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.9/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.10",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.10/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.11",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.11/lwc-synthetic-shadow.json",
            },
            {
              version: "1.3.12",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.3.12/lwc-synthetic-shadow.json",
            },
            {
              version: "1.4.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.4.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.5.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.5.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.5.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.5.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.5.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.5.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.5.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.5.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.5.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.5.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.6.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.6.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.6.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.6.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.6.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.6.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.6.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.6/lwc-synthetic-shadow.json",
            },
            {
              version: "1.6.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.7/lwc-synthetic-shadow.json",
            },
            {
              version: "1.6.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.8/lwc-synthetic-shadow.json",
            },
            {
              version: "1.6.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.6.9/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.6/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.7/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.8/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.9/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.10-228.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10-228.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.10-228.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10-228.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.10-228.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10-228.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.10-228.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10-228.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.10-228.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10-228.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.10",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.10/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.11",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.11/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.12",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.12/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.13",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.13/lwc-synthetic-shadow.json",
            },
            {
              version: "1.7.14",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.7.14/lwc-synthetic-shadow.json",
            },
            {
              version: "1.8.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.8.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.8.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.8.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.8.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.8.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.8.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.6/lwc-synthetic-shadow.json",
            },
            {
              version: "1.8.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.8.7/lwc-synthetic-shadow.json",
            },
            {
              version: "1.9.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.9.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.9.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.9.3-230.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.3-230.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.9.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.9.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.9.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.9.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.6/lwc-synthetic-shadow.json",
            },
            {
              version: "1.9.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.7/lwc-synthetic-shadow.json",
            },
            {
              version: "1.9.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.9.8/lwc-synthetic-shadow.json",
            },
            {
              version: "1.10.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.10.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.10.1-232.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.10.1-232.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.10.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.10.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.11.0-232.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.0-232.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.11.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.11.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.1/lwc-synthetic-shadow.json",
            },
            {
              version: "1.11.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.11.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.11.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.11.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.16.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.16.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.17.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.0/lwc-synthetic-shadow.json",
            },
            {
              version: "1.17.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.2/lwc-synthetic-shadow.json",
            },
            {
              version: "1.17.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.3/lwc-synthetic-shadow.json",
            },
            {
              version: "1.17.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.4/lwc-synthetic-shadow.json",
            },
            {
              version: "1.17.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.5/lwc-synthetic-shadow.json",
            },
            {
              version: "1.17.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.6/lwc-synthetic-shadow.json",
            },
            {
              version: "1.17.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.8/lwc-synthetic-shadow.json",
            },
            {
              version: "1.17.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.17.9/lwc-synthetic-shadow.json",
            },
            {
              version: "1.18.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/1.18.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.0.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.0.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.1.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.1.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.1.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.1.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.1.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.1.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.5/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.6/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.7/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.8/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.9/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.10-234.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.10-234.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.11",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.11/lwc-synthetic-shadow.json",
            },
            {
              version: "2.2.12",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.2.12/lwc-synthetic-shadow.json",
            },
            {
              version: "2.3.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.3.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.3.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.3.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.3.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.3.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.3.7/lwc-synthetic-shadow.json",
            },
            {
              version: "2.4.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.4.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.6/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.7/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.8/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.9",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.9/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.10",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.10/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.11",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.11/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.12",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.12/lwc-synthetic-shadow.json",
            },
            {
              version: "2.5.13",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.5.13/lwc-synthetic-shadow.json",
            },
            {
              version: "2.6.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.6.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.6.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.6.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.6.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.6.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.6.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.6.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.7.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.7.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.7.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.7.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.7.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.7.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.7.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.7.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.7.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.7.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.8.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.8.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.9.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.9.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.10.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.10.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.11.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.11.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.11.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.11.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.11.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.5/lwc-synthetic-shadow.json",
            },
            {
              version: "2.11.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.6/lwc-synthetic-shadow.json",
            },
            {
              version: "2.11.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.7/lwc-synthetic-shadow.json",
            },
            {
              version: "2.11.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.11.8/lwc-synthetic-shadow.json",
            },
            {
              version: "2.12.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.12.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.12.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.12.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.13.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.13.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.13.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.13.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.13.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.13.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.13.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.13.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.13.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.13.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.14.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.14.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.14.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.14.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.14.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.14.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.15.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.15.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.16.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.16.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.17.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.17.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.18.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.18.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.19.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.19.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.19.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.19.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.20.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.20.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.20.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.20.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.20.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.20.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.5/lwc-synthetic-shadow.json",
            },
            {
              version: "2.20.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.6/lwc-synthetic-shadow.json",
            },
            {
              version: "2.20.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.20.7/lwc-synthetic-shadow.json",
            },
            {
              version: "2.21.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.21.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.21.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.21.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.22.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.22.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.23.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.23.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.23.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.23.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.23.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.23.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.5/lwc-synthetic-shadow.json",
            },
            {
              version: "2.23.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.23.6/lwc-synthetic-shadow.json",
            },
            {
              version: "2.24.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.24.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.25.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.25.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.25.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.25.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.26.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.26.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.26.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.26.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.26.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.26.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.27.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.27.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.28.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.28.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.28.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.28.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.29.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.29.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.30.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.30.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.30.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.30.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.30.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.30.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.30.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.30.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.31.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.31.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.31.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.31.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.31.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.31.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.5/lwc-synthetic-shadow.json",
            },
            {
              version: "2.31.6",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.6/lwc-synthetic-shadow.json",
            },
            {
              version: "2.31.7",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.7/lwc-synthetic-shadow.json",
            },
            {
              version: "2.31.8",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.31.8/lwc-synthetic-shadow.json",
            },
            {
              version: "2.32.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.32.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.32.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.32.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.33.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.33.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.34.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.34.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.35.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.35.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.35.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.35.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.35.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.35.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.36.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.36.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.37.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.37.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.37.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.37.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.37.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.37.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.37.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.37.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.38.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.38.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.38.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.38.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.39.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.39.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.39.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.39.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.40.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.40.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.40.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.40.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.41.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.41.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.41.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.41.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.41.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.41.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.41.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.41.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.41.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.41.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.42.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.42.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.43.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.43.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.44.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.44.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.45.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.45.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.1/lwc-synthetic-shadow.json",
            },
            {
              version: "2.45.2",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.2/lwc-synthetic-shadow.json",
            },
            {
              version: "2.45.3",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.3/lwc-synthetic-shadow.json",
            },
            {
              version: "2.45.4",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.4/lwc-synthetic-shadow.json",
            },
            {
              version: "2.45.5",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.45.5/lwc-synthetic-shadow.json",
            },
            {
              version: "2.46.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.46.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.47.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.47.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.48.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.48.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.49.0",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.49.0/lwc-synthetic-shadow.json",
            },
            {
              version: "2.49.1",
              url: "https://d3nv1vpfin7fut.cloudfront.net/api/runtime/lwc-synthetic-shadow/2.49.1/lwc-synthetic-shadow.json",
            },
          ],
          tags: {
            canary: "2.11.3-238prod.0",
            latest: "2.49.1",
            next: "2.2.1",
            spring20: "1.1.13-224.8",
            winter20: "1.0.2-222.26",
            summer20: "1.3.7-226.7",
            winter19: "0.40.1-222.1",
            winter21: "1.7.10-228.5",
            spring21: "1.9.3-230.1",
            summer21: "1.17.9",
            winter22: "2.2.12",
            spring22: "2.5.13",
            "backport-2.6": "2.6.3",
            summer22: "2.11.8",
            winter23: "2.20.7",
            spring23: "2.31.8",
            "lbc-avante-garde": "2.40.2-lbc",
          },
          stable: "2.49.1",
        },
        CONTAINER_URL:
          "https://developer.salesforce.com/docs/component-library/tools/playground",
        APP_SLDS_VERSION: "2.8.3",
      },
    };
  }

  /**
   * Compile a simple component from files
   *
   * @param {string} componentName - Name of the component
   * @param {Object} files - Object with filename: content pairs
   * @param {Object} options - Additional options
   * @returns {Promise} - Resolves with compilation result
   */
  async compileSimple(componentName, files, options = {}) {
    const data = this.createComponentData(componentName, files, options);
    return this.compile(data);
  }

  /**
   * Terminate the worker
   */
  terminate() {
    this.worker.terminate();
    this.pendingMessages.clear();
    console.log("🛑 CompilerClient terminated");
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = CompilerClient;
}

// Export as default for ES6 modules
export default CompilerClient;
