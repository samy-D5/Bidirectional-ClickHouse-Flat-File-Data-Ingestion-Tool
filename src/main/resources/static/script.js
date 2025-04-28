document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const sourceTypeRadios = document.querySelectorAll(
    'input[name="sourceType"]'
  );
  const clickhouseSettings = document.getElementById("clickhouseSettings");
  const flatFileSettings = document.getElementById("flatFileSettings");
  const connectBtn = document.getElementById("connectBtn");
  const tableSelectionCard = document.getElementById("tableSelectionCard");
  const tableSelect = document.getElementById("tableSelect");
  const loadColumnsBtn = document.getElementById("loadColumnsBtn");
  const columnSelectionCard = document.getElementById("columnSelectionCard");
  const columnsContainer = document.getElementById("columnsContainer");
  const selectAllColumns = document.getElementById("selectAllColumns");
  const deselectAllColumns = document.getElementById("deselectAllColumns");
  const previewDataBtn = document.getElementById("previewDataBtn");
  const dataPreviewCard = document.getElementById("dataPreviewCard");
  const previewTableHeader = document.getElementById("previewTableHeader");
  const previewTableBody = document.getElementById("previewTableBody");
  const targetCard = document.getElementById("targetCard");
  const clickhouseTargetSettings = document.getElementById(
    "clickhouseTargetSettings"
  );
  const actionsCard = document.getElementById("actionsCard");
  const startIngestionBtn = document.getElementById("startIngestionBtn");
  const progressBarContainer = document.getElementById("progressBarContainer");
  const progressBar = document.getElementById("progressBar");
  const statusCard = document.getElementById("statusCard");
  const statusMessage = document.getElementById("statusMessage");
  const resultContainer = document.getElementById("resultContainer");
  const recordCount = document.getElementById("recordCount");
  const errorContainer = document.getElementById("errorContainer");
  const errorMessage = document.getElementById("errorMessage");
  const joinTablesCard = document.getElementById("joinTablesCard");
  const enableJoinSwitch = document.getElementById("enableJoinSwitch");
  const joinTablesBody = document.getElementById("joinTablesBody");
  const addTableBtn = document.getElementById("addTableBtn");
  const tablesContainer = document.getElementById("tablesContainer");
  const joinConditionsContainer = document.getElementById(
    "joinConditionsContainer"
  );
  const loadJoinColumnsBtn = document.getElementById("loadJoinColumnsBtn");

  // Global variables
  let currentSource = "clickhouse";
  let selectedTables = [];
  let availableColumns = [];
  let selectedColumns = [];
  let tableColumns = {};

  // Event Listeners
  sourceTypeRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      currentSource = this.value;
      if (currentSource === "clickhouse") {
        clickhouseSettings.style.display = "block";
        flatFileSettings.style.display = "none";
      } else {
        clickhouseSettings.style.display = "none";
        flatFileSettings.style.display = "block";
      }
    });
  });

  connectBtn.addEventListener("click", handleConnect);
  loadColumnsBtn.addEventListener("click", loadColumns);
  selectAllColumns.addEventListener("click", () => toggleAllColumns(true));
  deselectAllColumns.addEventListener("click", () => toggleAllColumns(false));
  previewDataBtn.addEventListener("click", previewData);
  startIngestionBtn.addEventListener("click", startIngestion);
  enableJoinSwitch.addEventListener("change", toggleJoinTables);
  addTableBtn.addEventListener("click", addTableSelection);
  loadJoinColumnsBtn.addEventListener("click", loadJoinColumns);

  // Functions
  function handleConnect() {
    updateStatus("Connecting...");

    if (currentSource === "clickhouse") {
      connectToClickHouse();
    } else {
      connectToFlatFile();
    }
  }

  function connectToClickHouse() {
    const host = document.getElementById("clickhouseHost").value;
    const port = document.getElementById("clickhousePort").value;
    const database = document.getElementById("clickhouseDatabase").value;
    const jwt = document.getElementById("clickhouseJWT").value;

    const clickhouseUrl = `jdbc:clickhouse://${host}:${port}`;

    // Build query params
    let params = new URLSearchParams({
      clickhouseUrl: clickhouseUrl,
      database: database,
    });

    if (jwt) {
      params.append("jwtToken", jwt);
    }

    // Fetch tables
    fetch(
      `/api/ingestion/tables?clickhouseUrl=${encodeURIComponent(
        clickhouseUrl
      )}&jwtToken=${encodeURIComponent(jwt)}&database=${encodeURIComponent(
        database
      )}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to connect to ClickHouse");
        }
        return response.json();
      })
      .then((tables) => {
        tableSelect.innerHTML = "";
        tables.forEach((table) => {
          const option = document.createElement("option");
          option.value = table;
          option.textContent = table;
          tableSelect.appendChild(option);
        });

        tableSelectionCard.style.display = "block";
        joinTablesCard.style.display = "block";

        // Populate multi-table join select as well
        const firstTableSelect = document.querySelector(".table-select");
        firstTableSelect.innerHTML = "";
        tables.forEach((table) => {
          const option = document.createElement("option");
          option.value = table;
          option.textContent = table;
          firstTableSelect.appendChild(option);
        });

        updateStatus("Connected to ClickHouse. Select a table to continue.");
      })
      .catch((error) => {
        showError("Connection failed: " + error.message);
      });
  }

  function connectToFlatFile() {
    const fileInput = document.getElementById("csvFile");
    if (!fileInput.files || fileInput.files.length === 0) {
      showError("Please select a CSV file");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/ingestion/get-csv-headers", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to read CSV file");
        }
        return response.json();
      })
      .then((headers) => {
        // Populate columns directly
        populateColumns(headers);
        columnSelectionCard.style.display = "block";
        targetCard.style.display = "block";
        clickhouseTargetSettings.style.display = "block";

        updateStatus("CSV file loaded. Select columns to continue.");
      })
      .catch((error) => {
        showError("File processing failed: " + error.message);
      });
  }

  function loadColumns() {
    const table = tableSelect.value;
    if (!table) {
      showError("Please select a table");
      return;
    }

    updateStatus("Loading columns...");

    const host = document.getElementById("clickhouseHost").value;
    const port = document.getElementById("clickhousePort").value;
    const database = document.getElementById("clickhouseDatabase").value;
    const jwt = document.getElementById("clickhouseJWT").value;

    const clickhouseUrl = `jdbc:clickhouse://${host}:${port}`;

    fetch(
      `/api/ingestion/columns?clickhouseUrl=${encodeURIComponent(
        clickhouseUrl
      )}&jwtToken=${encodeURIComponent(jwt)}&database=${encodeURIComponent(
        database
      )}&table=${encodeURIComponent(table)}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load columns");
        }
        return response.json();
      })
      .then((columns) => {
        populateColumns(columns);
        columnSelectionCard.style.display = "block";
        targetCard.style.display = "block";
        clickhouseTargetSettings.style.display =
          currentSource === "flatFile" ? "block" : "none";

        updateStatus("Columns loaded. Select columns to continue.");
      })
      .catch((error) => {
        showError("Failed to load columns: " + error.message);
      });
  }

  function populateColumns(columns) {
    availableColumns = columns;
    columnsContainer.innerHTML = "";

    columns.forEach((column) => {
      const checkDiv = document.createElement("div");
      checkDiv.className = "form-check column-check";

      const checkInput = document.createElement("input");
      checkInput.className = "form-check-input";
      checkInput.type = "checkbox";
      checkInput.id = `col-${column}`;
      checkInput.value = column;
      checkInput.checked = true;

      const checkLabel = document.createElement("label");
      checkLabel.className = "form-check-label";
      checkLabel.htmlFor = `col-${column}`;
      checkLabel.textContent = column;

      checkDiv.appendChild(checkInput);
      checkDiv.appendChild(checkLabel);
      columnsContainer.appendChild(checkDiv);
    });

    actionsCard.style.display = "block";
    statusCard.style.display = "block";
  }

  function toggleAllColumns(checked) {
    const checkboxes = columnsContainer.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = checked;
    });
  }

  function getSelectedColumns() {
    const checkboxes = columnsContainer.querySelectorAll(
      'input[type="checkbox"]:checked'
    );
    return Array.from(checkboxes).map((checkbox) => checkbox.value);
  }

  function previewData() {
    const selectedCols = getSelectedColumns();
    if (selectedCols.length === 0) {
      showError("Please select at least one column");
      return;
    }

    updateStatus("Loading preview data...");

    if (currentSource === "clickhouse") {
      previewClickHouseData(selectedCols);
    } else {
      previewCSVData();
    }
  }

  function previewClickHouseData(selectedCols) {
    const host = document.getElementById("clickhouseHost").value;
    const port = document.getElementById("clickhousePort").value;
    const database = document.getElementById("clickhouseDatabase").value;
    const table = tableSelect.value;
    const jwt = document.getElementById("clickhouseJWT").value;

    const clickhouseUrl = `jdbc:clickhouse://${host}:${port}`;

    let url = `/api/ingestion/preview-clickhouse?clickhouseUrl=${encodeURIComponent(
      clickhouseUrl
    )}&jwtToken=${encodeURIComponent(jwt)}&database=${encodeURIComponent(
      database
    )}&table=${encodeURIComponent(table)}&limit=100`;

    if (selectedCols.length > 0) {
      selectedCols.forEach((col) => {
        url += `&columns=${encodeURIComponent(col)}`;
      });
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load preview data");
        }
        return response.json();
      })
      .then((data) => {
        displayPreviewData(data, selectedCols);
        updateStatus("Preview data loaded.");
      })
      .catch((error) => {
        showError("Failed to load preview data: " + error.message);
      });
  }

  function previewCSVData() {
    const fileInput = document.getElementById("csvFile");
    if (!fileInput.files || fileInput.files.length === 0) {
      showError("Please select a CSV file");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/ingestion/preview-file?limit=100", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to read CSV file");
        }
        return response.json();
      })
      .then((data) => {
        const selectedCols = getSelectedColumns();
        displayPreviewData(data, selectedCols);
        updateStatus("Preview data loaded.");
      })
      .catch((error) => {
        showError("File processing failed: " + error.message);
      });
  }

  function displayPreviewData(data, columns) {
    if (!data || data.length === 0) {
      showError("No data to preview");
      return;
    }

    // Clear previous preview
    previewTableHeader.innerHTML = "";
    previewTableBody.innerHTML = "";

    // Add header row
    columns.forEach((column) => {
      const th = document.createElement("th");
      th.textContent = column;
      previewTableHeader.appendChild(th);
    });

    // Add data rows
    data.forEach((row) => {
      const tr = document.createElement("tr");

      columns.forEach((column) => {
        const td = document.createElement("td");
        td.textContent = row[column] || "";
        tr.appendChild(td);
      });

      previewTableBody.appendChild(tr);
    });

    dataPreviewCard.style.display = "block";
  }

  function startIngestion() {
    const selectedCols = getSelectedColumns();
    if (selectedCols.length === 0) {
      showError("Please select at least one column");
      return;
    }

    updateStatus("Starting ingestion...");
    progressBarContainer.style.display = "block";
    progressBar.style.width = "50%";

    if (currentSource === "clickhouse") {
      if (enableJoinSwitch.checked) {
        exportJoinedTablesToFile(selectedCols);
      } else {
        exportClickHouseToFile(selectedCols);
      }
    } else {
      importFileToClickHouse(selectedCols);
    }
  }

  function exportClickHouseToFile(selectedCols) {
    const host = document.getElementById("clickhouseHost").value;
    const port = document.getElementById("clickhousePort").value;
    const database = document.getElementById("clickhouseDatabase").value;
    const table = tableSelect.value;
    const jwt = document.getElementById("clickhouseJWT").value;

    const clickhouseUrl = `jdbc:clickhouse://${host}:${port}`;

    // Build URL with selected columns
    let url = `/api/ingestion/clickhouse-to-file-selective?clickhouseUrl=${encodeURIComponent(
      clickhouseUrl
    )}&jwtToken=${encodeURIComponent(jwt)}&database=${encodeURIComponent(
      database
    )}&table=${encodeURIComponent(table)}`;

    selectedCols.forEach((col) => {
      url += `&columns=${encodeURIComponent(col)}`;
    });

    fetch(url, {
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ingestion failed");
        }
        return response.text();
      })
      .then((result) => {
        progressBar.style.width = "100%";
        resultContainer.style.display = "block";

        // Extract count from result message
        const countMatch = result.match(/(\d+) rows/);
        const count = countMatch ? countMatch[1] : "Unknown";
        recordCount.textContent = count;

        updateStatus("Ingestion completed successfully!");
      })
      .catch((error) => {
        progressBar.style.width = "100%";
        progressBar.classList.remove("bg-info");
        progressBar.classList.add("bg-danger");
        showError("Ingestion failed: " + error.message);
      });
  }

  function importFileToClickHouse(selectedCols) {
    const fileInput = document.getElementById("csvFile");
    if (!fileInput.files || fileInput.files.length === 0) {
      showError("Please select a CSV file");
      return;
    }

    const host = document.getElementById("targetClickhouseHost").value;
    const port = document.getElementById("targetClickhousePort").value;
    const database = document.getElementById("targetClickhouseDatabase").value;
    const table = document.getElementById("targetClickhouseTable").value;
    const jwt = document.getElementById("targetClickhouseJWT").value;

    if (!database || !table) {
      showError("Please provide target database and table names");
      return;
    }

    const clickhouseUrl = `jdbc:clickhouse://${host}:${port}`;

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("clickhouseUrl", clickhouseUrl);
    formData.append("jwtToken", jwt);
    formData.append("database", database);
    formData.append("table", table);

    selectedCols.forEach((col) => {
      formData.append("columns", col);
    });

    fetch("/api/ingestion/file-to-clickhouse-selective", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ingestion failed");
        }
        return response.text();
      })
      .then((result) => {
        progressBar.style.width = "100%";
        resultContainer.style.display = "block";

        // Extract count from result message
        const countMatch = result.match(/(\d+) rows/);
        const count = countMatch ? countMatch[1] : "Unknown";
        recordCount.textContent = count;

        updateStatus("Ingestion completed successfully!");
      })
      .catch((error) => {
        progressBar.style.width = "100%";
        progressBar.classList.remove("bg-info");
        progressBar.classList.add("bg-danger");
        showError("Ingestion failed: " + error.message);
      });
  }

  function toggleJoinTables() {
    if (enableJoinSwitch.checked) {
      joinTablesBody.style.display = "block";
    } else {
      joinTablesBody.style.display = "none";
    }
  }

  function addTableSelection() {
    const tableCount = document.querySelectorAll(".table-select").length;

    const selectDiv = document.createElement("div");
    selectDiv.className = "mb-3";

    const select = document.createElement("select");
    select.className = "form-select table-select";
    select.dataset.index = tableCount;

    // Clone options from the first select
    const firstSelect = document.querySelector(".table-select");
    Array.from(firstSelect.options).forEach((option) => {
      const newOption = document.createElement("option");
      newOption.value = option.value;
      newOption.textContent = option.textContent;
      select.appendChild(newOption);
    });

    selectDiv.appendChild(select);
    tablesContainer.appendChild(selectDiv);

    // Add join condition input if this is the second or later table
    if (tableCount > 0) {
      addJoinCondition(tableCount);
    }

    select.addEventListener("change", () => {
      updateJoinConditionLabels();
    });
  }

  function addJoinCondition(tableIndex) {
    const conditionDiv = document.createElement("div");
    conditionDiv.className = "join-condition";
    conditionDiv.dataset.forTable = tableIndex;

    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = `Join Condition for Table ${tableIndex + 1}`;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control";
    input.placeholder = "e.g., table1.id = table2.foreign_id";

    conditionDiv.appendChild(label);
    conditionDiv.appendChild(input);

    joinConditionsContainer.appendChild(conditionDiv);
  }

  function updateJoinConditionLabels() {
    const tableSelects = document.querySelectorAll(".table-select");
    const joinConditions = document.querySelectorAll(".join-condition");

    joinConditions.forEach((condition) => {
      const tableIndex = parseInt(condition.dataset.forTable);
      const firstTable = tableSelects[0].value;
      const joinTable = tableSelects[tableIndex].value;

      const label = condition.querySelector("label");
      label.textContent = `Join Condition: ${firstTable} JOIN ${joinTable}`;

      const input = condition.querySelector("input");
      input.placeholder = `e.g., ${firstTable}.id = ${joinTable}.foreign_id`;
    });
  }

  function loadJoinColumns() {
    const tableSelects = document.querySelectorAll(".table-select");
    const joinConditions = document.querySelectorAll(".join-condition input");

    if (tableSelects.length < 2) {
      showError("Please add at least two tables for join");
      return;
    }

    for (let i = 0; i < joinConditions.length; i++) {
      if (!joinConditions[i].value.trim()) {
        showError(`Please provide join condition for table ${i + 2}`);
        return;
      }
    }

    // Get all tables and their columns
    const host = document.getElementById("clickhouseHost").value;
    const port = document.getElementById("clickhousePort").value;
    const database = document.getElementById("clickhouseDatabase").value;
    const jwt = document.getElementById("clickhouseJWT").value;

    const clickhouseUrl = `jdbc:clickhouse://${host}:${port}`;

    // First, get all tables
    selectedTables = Array.from(tableSelects).map((select) => select.value);
    tableColumns = {};

    // Get columns for each table
    const promises = selectedTables.map((table) => {
      return fetch(
        `/api/ingestion/columns?clickhouseUrl=${encodeURIComponent(
          clickhouseUrl
        )}&jwtToken=${encodeURIComponent(jwt)}&database=${encodeURIComponent(
          database
        )}&table=${encodeURIComponent(table)}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load columns for table ${table}`);
          }
          return response.json();
        })
        .then((columns) => {
          tableColumns[table] = columns;
          return columns;
        });
    });

    Promise.all(promises)
      .then(() => {
        // Combine all columns with table prefixes
        const allColumns = [];
        for (const table in tableColumns) {
          tableColumns[table].forEach((column) => {
            allColumns.push(`${table}.${column}`);
          });
        }

        // Populate column selection
        populateColumns(allColumns);
        columnSelectionCard.style.display = "block";

        updateStatus("Join columns loaded. Select columns to continue.");
      })
      .catch((error) => {
        showError("Failed to load join columns: " + error.message);
      });
  }

  function exportJoinedTablesToFile(selectedCols) {
    const host = document.getElementById("clickhouseHost").value;
    const port = document.getElementById("clickhousePort").value;
    const database = document.getElementById("clickhouseDatabase").value;
    const jwt = document.getElementById("clickhouseJWT").value;

    const clickhouseUrl = `jdbc:clickhouse://${host}:${port}`;

    // Get tables and join conditions
    const tableSelects = document.querySelectorAll(".table-select");
    const joinConditions = document.querySelectorAll(".join-condition input");

    const tables = Array.from(tableSelects).map((select) => select.value);

    // Create form data for the join request
    const formData = new FormData();
    formData.append("clickhouseUrl", clickhouseUrl);
    formData.append("jwtToken", jwt);
    formData.append("database", database);

    tables.forEach((table) => {
      formData.append("tables", table);
    });

    // Add join conditions
    for (let i = 0; i < joinConditions.length; i++) {
      const joinTable = tables[i + 1];
      formData.append(`joinConditions[${joinTable}]`, joinConditions[i].value);
    }

    // Add selected columns
    selectedCols.forEach((col) => {
      formData.append("columns", col);
    });

    fetch("/api/ingestion/clickhouse-join-to-file", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Join operation failed");
        }
        return response.text();
      })
      .then((result) => {
        progressBar.style.width = "100%";
        resultContainer.style.display = "block";

        // Extract count from result message
        const countMatch = result.match(/(\d+) rows/);
        const count = countMatch ? countMatch[1] : "Unknown";
        recordCount.textContent = count;

        updateStatus("Join operation completed successfully!");
      })
      .catch((error) => {
        progressBar.style.width = "100%";
        progressBar.classList.remove("bg-info");
        progressBar.classList.add("bg-danger");
        showError("Join operation failed: " + error.message);
      });
  }

  function updateStatus(message) {
    statusMessage.textContent = message;
    statusMessage.className = "alert alert-info";
    errorContainer.style.display = "none";
  }

  function showError(message) {
    statusMessage.className = "alert alert-danger";
    statusMessage.textContent = "Error";
    errorContainer.style.display = "block";
    errorMessage.textContent = message;
  }
});
