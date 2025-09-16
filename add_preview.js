setTimeout(findFileList, 1000);

function findFileList() {
    const file_list = getFileList();
    if (!file_list) {
        setTimeout(findFileList, 1000);
        return;
    }
    makeBlue(file_list);
}

function makeBlue(file_list) {
    for (const row of file_list) {
        row.style.backgroundColor = 'yellow';
    }
}

function getFileList() {
    // TODO: make sure this check is actually necessary, because I think it might not be
    if (!document.URL.includes('https://secure20.e-boekhouden.nl/overig/digitaal-archief'))
        return false;
    const file_list_body_query = document.querySelectorAll('app-digitaal-archief-file-list > div.main-files > div > div.body');
    if (file_list_body_query.length !== 1)
        return false;
    const file_list = file_list_body_query[0].children;
    return file_list;
}