// how much time between checking if the file list changed
const updateTime = 1000;

setTimeout(addViewboxLinksIfAbsent, 100);


async function addViewboxLinksIfAbsent() {
    const fileListElements = getFileList();
    // if the fileListElements are not present, it means the user is on the wrong page
    // or the addon is called in the wrong iframe
    // if the viewbox is already added, it doesn't need to be added again until it is updated
    if (fileListElements && !checkIfViewboxAdded(fileListElements)) {
        const fileListData = await getFileListData();
        const fileListDataByName = indexFileListByName(fileListData);
        setViewboxLinks(fileListElements, fileListDataByName);
        markViewboxAdded(fileListElements);
    }
    // try again in case the user changes subpage or the file list has changed
    setTimeout(addViewboxLinksIfAbsent, updateTime);
}

function indexFileListByName(fileListData) {
    const result = new Map();
    for (const file of fileListData) {
        result.set(file.naam, file);
    }
    return result;
}

// check if the mark added by markViewboxAdded on the first row is present or not
function checkIfViewboxAdded(fileListElements) {
    const firstRow = fileListElements[0];
    // if the file list is empty, technically all of them have a viewbox
    if (!firstRow)
        return true;
    return firstRow.getAttribute('viewbox-added') === 'true';
}

// mark the first row so it is easy to check if the rows got updated
function markViewboxAdded(fileListElements) {
    const firstRow = fileListElements[0];
    if (firstRow)
        firstRow.setAttribute('viewbox-added', 'true');
}

function setViewboxLinks(fileListElements, fileListDataByName) {
    // count num rows that are and aren't coupled
    let numNietGekoppeld = 0;
    let numGekoppeld = 0;
    let numDirectories = 0;
    for (const file of fileListDataByName.values()) {
        if (file.soort === 'D')
            numDirectories++;
        else if (file.koppelCount === 0)
            numNietGekoppeld++;
        else
            numGekoppeld++;
    }
    // assertion that there are equal number of file DOM elements as files in the fetched file list
    if (fileListElements.length !== fileListDataByName.size) {
        console.error('the file list does not have the same number of rows as the filelist data');
    }

    let indexNietGekoppeld = 0;
    let indexGekoppeld = 0;

    for (const row of fileListElements) {
        // get the span element that contains the file name
        const fileNameField = row.querySelector('div.g-name > span');
        if (!fileNameField)
            throw new Error('query the name field of file row failed');

        // get the file name and search the file id
        const fileName = fileNameField.getAttribute('title');
        const fileData = fileListDataByName.get(fileName);
        // skip directories, only include files
        if (fileData.soort === 'D')
            continue;
        const fileLink = `https://secure20.e-boekhouden.nl/v1/api/folder/${fileData.id}/preview?inline=true`;

        // create an html element that opens a lightbox
        const viewboxLink = document.createElement('a');
        viewboxLink.setAttribute('href', fileLink);

        if (fileData.koppelCount === 0) {
            indexNietGekoppeld++;
            viewboxLink.setAttribute('data-fancybox', 'file-list-niet-gekoppeld');
            viewboxLink.setAttribute('data-caption', `${fileName} (${indexNietGekoppeld}/${numNietGekoppeld} niet gekoppeld)`);
        }
        else {
            indexGekoppeld++;
            viewboxLink.setAttribute('data-fancybox', 'file-list-gekoppeld');
            viewboxLink.setAttribute('data-caption', `${fileName} (${indexGekoppeld}/${numGekoppeld} gekoppeld)`);
        }
        if (fileName.toLowerCase().endsWith('.pdf')) {
            viewboxLink.setAttribute('data-type', 'pdf');
        }
        else if (fileName.toLowerCase().endsWith('.txt')) {
            viewboxLink.setAttribute('data-type', 'iframe');
        }

        // encapsulate the file name field element within the viewbox link element
        fileNameField.parentNode.appendChild(viewboxLink);
        viewboxLink.appendChild(fileNameField);
    }
    Fancybox.bind("[data-fancybox]", {
        // prevents fancybox from triggering a file list reload
        Hash: false,
        Carousel: {
            Thumbs: {
                thumbTpl: '<button aria-label="Slide to #{{page}}"><div style="text-align: center; color: white;">{{index}}</div></button>'
            },
        }
    });
}

async function getFileListData() {
    try {
        const response = await fetch("https://secure20.e-boekhouden.nl/v1/api/folder/0/filelist?includeDelete=false");
        if (!response.ok) {
            throw new Error(`HTTP error, status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Fetch failed", err);
    }
}

function getFileList() {
    // TODO: make sure this check is actually necessary, because I think it might not be
    if (!document.URL.includes('https://secure20.e-boekhouden.nl/overig/digitaal-archief')) {
        return false;
    }
    const file_list_body_query = document.querySelectorAll('app-digitaal-archief-file-list > div.main-files > div > div.body');
    if (file_list_body_query.length !== 1)
        return false;
    const file_list = file_list_body_query[0].children;
    return file_list;
}