export const processHtmlForSubmission = (htmlContent: string) => {
    if (!htmlContent) return "";
    console.log(htmlContent,"htmlcontent")
    // 1. Create a DOM parser to manipulate the HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 2. Select all the spans you created with your insertFraction function
    // Note: We target the class 'ql-formula' as defined in your insert function
    const formulas = doc.querySelectorAll('span.ql-formula');

    formulas.forEach((node) => {
        // 3. Get the raw LaTeX stored in the data-value attribute
        const latexValue = node.getAttribute('data-value');
        
        if (latexValue) {
            // 4. Create a text node with just the LaTeX
            // You can wrap this in delimiters if your backend needs it, e.g., `$$${latexValue}$$`
            // For now, based on your request, we just return the raw latex.
            const textNode = document.createTextNode(latexValue);
            
            // 5. Replace the complex HTML node with the simple text node
            node.parentNode?.replaceChild(textNode, node);
        }
    });

    return doc.body.innerHTML;
};