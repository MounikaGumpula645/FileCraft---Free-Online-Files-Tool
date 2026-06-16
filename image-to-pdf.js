const imageInput = document.getElementById("imageInput");
const selectBtn = document.getElementById("selectBtn");
const dropZone = document.getElementById("dropZone");
const previewGrid = document.getElementById("previewGrid");

const imageCount = document.getElementById("imageCount");
const previewCount = document.getElementById("previewCount");
const totalSize = document.getElementById("totalSize");

const clearBtn = document.getElementById("clearBtn");
const convertBtn = document.getElementById("convertBtn");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

const pageSizeSelect = document.getElementById("pageSize");
const orientationSelect = document.getElementById("orientation");
const qualitySelect = document.getElementById("quality");
const marginSelect = document.getElementById("margin");
let selectedImages = [];
const loadingOverlay =
document.getElementById("loadingOverlay");

const loadingStatus =
document.getElementById("loadingStatus");

const overlayProgressFill =
document.getElementById("overlayProgressFill");

/* ------------------------
   SELECT FILES
-------------------------*/

selectBtn.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", (e) => {
    addFiles([...e.target.files]);
});

/* ------------------------
   DRAG & DROP
-------------------------*/

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();

    dropZone.classList.remove("dragover");

    addFiles([...e.dataTransfer.files]);
});

/* ------------------------
   ADD FILES
-------------------------*/

function addFiles(files) {

    const validFiles = files.filter(file =>
        file.type.startsWith("image/")
    );

    validFiles.forEach(file => {

        selectedImages.push({
            id: crypto.randomUUID(),
            file,
            rotation: 0
        });

    });

    renderPreview();
}

/* ------------------------
   RENDER
-------------------------*/

function renderPreview() {

    if (selectedImages.length === 0) {

        previewGrid.classList.add("empty");

        previewGrid.innerHTML = `
            <p>No Images Selected</p>
        `;

          updateStats();
        return;
    }

    previewGrid.classList.remove("empty");

    previewGrid.innerHTML = "";

    selectedImages.forEach(item => {

        const url = URL.createObjectURL(item.file);

        const card = document.createElement("div");

        card.className = "preview-card";
        card.dataset.id = item.id;

        card.innerHTML = `
            <img
                src="${url}"
                class="preview-image"
                loading="lazy"
            >

            <div class="preview-info">

                <div class="preview-name">
                    ${item.file.name}
                </div>

                <div class="preview-size">
                    ${formatSize(item.file.size)}
                </div>

                <div class="preview-actions">

                    <button
                        class="card-btn rotate-btn"
                        data-id="${item.id}"
                    >
                        ↻
                    </button>

                    <button
                        class="card-btn remove-btn"
                        data-id="${item.id}"
                    >
                        ✕
                    </button>

                </div>

            </div>
        `;

        const img = card.querySelector(".preview-image");

        img.onload = () => {
            URL.revokeObjectURL(url);
        };

        previewGrid.appendChild(card);
    });

    updateStats();
}

/* ------------------------
   STATS
-------------------------*/

function updateStats() {

    imageCount.textContent =
        selectedImages.length;

    previewCount.textContent =
        `${selectedImages.length} Files`;

    const totalBytes =
        selectedImages.reduce(
            (sum,item)=>sum+item.file.size,
            0
        );

    totalSize.textContent =
        formatSize(totalBytes);

    if(selectedImages.length){

        convertBtn.textContent =
            `Convert ${selectedImages.length} Images to PDF`;

    }else{

        convertBtn.textContent =
            "Convert to PDF";
    }
}

/* ------------------------
   FORMAT SIZE
-------------------------*/

function formatSize(bytes){

    if(bytes===0) return "0 MB";


        if(bytes < 1024 * 1024){
    return (bytes / 1024).toFixed(1) + " KB";
}

return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

/* ------------------------
   REMOVE IMAGE
-------------------------*/

document.addEventListener("click",(e)=>{

    if(e.target.classList.contains("remove-btn")){

        const id =
            e.target.dataset.id;

        selectedImages =
            selectedImages.filter(
                img => img.id !== id
            );

        renderPreview();
    }

});

/* ------------------------
   ROTATE
-------------------------*/

document.addEventListener("click",(e)=>{

    if(e.target.classList.contains("rotate-btn")){

        const id =
            e.target.dataset.id;

        const image =
            selectedImages.find(
                img => img.id === id
            );

        if(!image) return;

        image.rotation =
    (image.rotation + 90) % 360;

        const card =
            e.target.closest(".preview-card");

        const img =
            card.querySelector(".preview-image");

        img.style.transform =
            `rotate(${image.rotation}deg)`;
    }

});

/* ------------------------
   CLEAR ALL
-------------------------*/

clearBtn.addEventListener("click",()=>{

    selectedImages = [];

    renderPreview();
});

/* ------------------------
   SORTABLE
-------------------------*/

new Sortable(previewGrid, {

    animation: 200,

    onEnd: function(evt){

        const moved =
            selectedImages.splice(
                evt.oldIndex,
                1
            )[0];

        selectedImages.splice(
            evt.newIndex,
            0,
            moved
        );
    }

});

/* ------------------------
   INITIAL STATE
-------------------------*/

renderPreview();

convertBtn.addEventListener("click", async () => {

    if (!selectedImages.length) return;

    loadingOverlay.classList.remove("hidden");

    loadingStatus.textContent =
        "Preparing Images...";

    overlayProgressFill.style.width =
        "2%";

    convertBtn.disabled = true;

    convertBtn.innerHTML =
        "Preparing...";

    await generatePDF();

});
async function generatePDF() {

    if (!selectedImages.length) {
        alert("Please select images first.");
        return;
    }

    try {

        convertBtn.disabled = true;
        progressText.textContent = "Preparing PDF...";

        const { jsPDF } = window.jspdf;

        const pageSize =
            pageSizeSelect.value;

        const orientation =
            orientationSelect.value === "auto"
                ? "portrait"
                : orientationSelect.value;

        const pdf = new jsPDF({
            orientation,
            unit: "mm",
            format: pageSize,
            compress: true
        });

        const pageWidth =
            pdf.internal.pageSize.getWidth();

        const pageHeight =
            pdf.internal.pageSize.getHeight();

        const margin =
            Number(marginSelect.value);

        const quality =
            Number(qualitySelect.value);

        for (let i = 0; i < selectedImages.length; i++) {

            loadingStatus.textContent =
              `Creating page ${i + 1}/${selectedImages.length}`;
              const progress =
             ((i + 1) / selectedImages.length) * 100;

             overlayProgressFill.style.width =
             `${progress}%`;

             progressFill.style.width =
             `${progress}%`;

           

            if (i > 0) {
                pdf.addPage();
            }

            const imageData =
                await prepareImage(
                    selectedImages[i],
                    quality
                );

            const imgWidth =
                imageData.width;

            const imgHeight =
                imageData.height;

            const availableWidth =
                pageWidth - margin * 2;

            const availableHeight =
                pageHeight - margin * 2;

            const scale =
                Math.min(
                    availableWidth / imgWidth,
                    availableHeight / imgHeight
                );

            const renderWidth =
                imgWidth * scale;

            const renderHeight =
                imgHeight * scale;

            const x =
                (pageWidth - renderWidth) / 2;

            const y =
                (pageHeight - renderHeight) / 2;

            pdf.addImage(
                imageData.dataUrl,
                "JPEG",
                x,
                y,
                renderWidth,
                renderHeight,
                undefined,
                "FAST"
            );

            await new Promise(resolve =>
                setTimeout(resolve, 0)
            );
        }

       
loadingStatus.textContent =
    "Preparing Download...";

overlayProgressFill.style.width =
    "100%";

pdf.save("filecraft-images.pdf");

loadingStatus.textContent =
    "PDF Created Successfully ✓";

await new Promise(resolve =>
    setTimeout(resolve, 1200)
);

loadingOverlay.classList.add(
    "hidden"
);

showToast(
    "PDF Created Successfully"
);
    } catch (error) {

        console.error(error);

        alert(
            "Failed to generate PDF."
        );

    } finally {

    loadingOverlay.classList.add(
        "hidden"
    );

    convertBtn.disabled = false;

    updateStats();

    setTimeout(() => {

        progressFill.style.width = "0%";

        progressText.textContent =
            "Ready";

    }, 2000);
}
}
async function prepareImage(item, quality) {

    const bitmap =
        await createImageBitmap(item.file);

    const canvas =
        document.createElement("canvas");

    let width = bitmap.width;
    let height = bitmap.height;

    const MAX_DIMENSION = 2500;

    if (width > height) {

        if (width > MAX_DIMENSION) {

            height *=
                MAX_DIMENSION / width;

            width =
                MAX_DIMENSION;
        }

    } else {

        if (height > MAX_DIMENSION) {

            width *=
                MAX_DIMENSION / height;

            height =
                MAX_DIMENSION;
        }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx =
        canvas.getContext("2d");

    ctx.save();

    if (item.rotation) {

        const radians =
            item.rotation *
            Math.PI / 180;

        canvas.width =
            item.rotation % 180 === 0
                ? width
                : height;

        canvas.height =
            item.rotation % 180 === 0
                ? height
                : width;

        ctx.translate(
            canvas.width / 2,
            canvas.height / 2
        );

        ctx.rotate(radians);

        ctx.drawImage(
            bitmap,
            -width / 2,
            -height / 2,
            width,
            height
        );

    } else {

        ctx.drawImage(
            bitmap,
            0,
            0,
            width,
            height
        );
    }

    ctx.restore();

    const dataUrl =
        canvas.toDataURL(
            "image/jpeg",
            quality
        );

    bitmap.close();

    return {
        dataUrl,
        width: canvas.width,
        height: canvas.height
    };
}
function showToast(message){

    const toast =
        document.getElementById("toast");

    if(!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2500);
}