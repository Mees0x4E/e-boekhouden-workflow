const viewbox = 'fancybox';

if (viewbox === 'lightbox')
    // turn off all animations, because I only care about speed
    lightbox.option({
        fadeDuration: 0,
        imageFadeDuration: 0,
        resizeDuration: 0,
    });

setTimeout(findFileList, 100);

async function findFileList() {
    const fileListElements = getFileList();
    if (!fileListElements) {
        setTimeout(findFileList, 1000);
        return;
    }
    const fileListData = await getFileListData();
    const fileListDataByName = indexFileListByName(fileListData);
    setLightboxLinks(fileListElements, fileListDataByName);
}

function indexFileListByName(fileListData) {
    const result = new Map();
    for (const file of fileListData) {
        result.set(file.naam, file);
    }
    return result;
}

async function setLightboxLinks(fileListElements, fileListDataByName) {
    for (const row of fileListElements) {
        // get the span element that contains the file name
        const fileNameField = row.querySelector('div.g-name > span');
        if (!fileNameField)
            throw new Error('query the name field of file row failed');

        // get the file name and search the file id
        const fileName = fileNameField.getAttribute('title');
        const fileData = fileListDataByName.get(fileName);
        const fileLink = `https://secure20.e-boekhouden.nl/v1/api/folder/${fileData.id}/preview?inline=true`;

        // create an html element that opens a lightbox
        const viewboxLink = document.createElement('a');
        viewboxLink.setAttribute('href', fileLink);
        if (viewbox === 'fancybox') {
            viewboxLink.setAttribute('data-fancybox', 'file-list');
            viewboxLink.setAttribute('data-caption', fileName);
            if (fileName.toLowerCase().endsWith('.pdf')) {
                viewboxLink.setAttribute('data-type', 'pdf');
            }
            else if (fileName.toLowerCase().endsWith('.txt')) {
                viewboxLink.setAttribute('data-type', 'iframe');
            }
        }
        else if (viewbox === 'lightbox') {
            viewboxLink.setAttribute('data-lightbox', `file-${fileData.id}`);
            viewboxLink.setAttribute('data-title', fileName);
        }

        // encapsulate the file name field element within the lightbox link element
        fileNameField.parentNode.appendChild(viewboxLink);
        viewboxLink.appendChild(fileNameField);
    }
    if (viewbox === 'fancybox') {
        Fancybox.bind("[data-fancybox]", {
            // prevents fancybox from triggering a file list reload
            Hash: false
        });
    }
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

function makeBlue(file_list) {
    for (const row of file_list) {
        row.style.backgroundColor = 'yellow';
        const button = document.createElement('button');
        button.innerText = getRowName(row);
        row.appendChild(button);
    }
}
function getRowName(row) {
    const gNameQuery = row.getElementsByClassName('g-name');
    const spanQuery = gNameQuery[0].getElementsByTagName('span');
    return spanQuery[0].getAttribute('title');
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