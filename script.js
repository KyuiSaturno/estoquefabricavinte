// Mantenha aqui a sua URL do Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5wtsSda51rruXfp6k2vgu3Oj7FuP_uNJqnJypJ_ft8FC9OToInhlO7PmGF4XZbOij/exec";

// Variáveis globais
let usuarioLogado = "";
let dadosProdutosFiltrados = []; 
let carrinho = [];           
let indicesImagens = {};   

// ==========================================
// CONTROLADOR DE NAVEGAÇÃO
// ==========================================
function alternarAba(abaDestino) {
    const abaProdutos = document.getElementById("aba-produtos");
    const btnProdutos = document.getElementById("btn-aba-produtos");

    if (abaDestino === 'produtos' || abaDestino === 'inicio') {
        if (abaProdutos) abaProdutos.classList.remove("escondido");
        if (btnProdutos) btnProdutos.classList.add("ativa");
    }
}

// ==========================================
// LOGIN E INICIALIZAÇÃO
// ==========================================
async function fazerLogin() {
    const usuarioInput = document.getElementById("usuario").value.trim();
    const senhaInput = document.getElementById("senha").value.trim();
    const erroLogin = document.getElementById("erro-login");
    const btnLogin = document.getElementById("btn-login");

    if (!usuarioInput || !senhaInput) {
        erroLogin.innerText = "Preencha todos os campos.";
        return;
    }

    btnLogin.innerText = "Verificando...";
    btnLogin.disabled = true;
    erroLogin.innerText = "";

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({ acao: "login", usuario: usuarioInput, senha: senhaInput }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            usuarioLogado = usuarioInput;
            
            const elOperadorPc = document.getElementById("nome-operador-pc");
            const elOperadorMobile = document.getElementById("nome-operador-mobile");
            
            if (elOperadorPc) elOperadorPc.innerText = `Usuário: ${usuarioLogado}`;
            if (elOperadorMobile) elOperadorMobile.innerText = usuarioLogado;
            
            document.getElementById("tela-login").classList.add("escondido");
            document.getElementById("painel-principal").classList.remove("escondido");
            
            alternarAba('produtos');
            carregarCategoriasDinamicas();
        } else {
            erroLogin.innerText = resultado.erro || "Usuário ou senha incorretos.";
            btnLogin.innerText = "Entrar";
            btnLogin.disabled = false;
        }
    } catch (erro) {
        erroLogin.innerText = "Erro ao conectar com o servidor.";
        btnLogin.innerText = "Entrar";
        btnLogin.disabled = false;
    }
}

// ==========================================
// CARRINHO E GAVETA MOBILE (CORRIGIDO)
// ==========================================
function toggleCarrinhoMobile() {
    const gaveta = document.getElementById("carrinho-gaveta");
    if (gaveta) {
        gaveta.classList.toggle("aberto");
    }
}

// ==========================================
// LÓGICA DE PRODUTOS E CARRINHO (REMANESCENTE)
// ==========================================
// (Mantenha as funções carregarCategoriasDinamicas, filtrarPorCategoria, 
// aplicarFiltroVisual, renderizarProdutos e atualizarInterfaceCarrinho 
// exatamente como você já tem no seu arquivo original)

// DICA: Certifique-se de que a função confirmarBaixa() 
// também chame toggleCarrinhoMobile() ao finalizar para fechar a gaveta após o envio.

async function confirmarBaixa() {
    const btn = document.getElementById("btn-confirmar");
    btn.innerText = "Enviando...";
    btn.disabled = true;

    // ... (sua lógica de fetch para salvar os dados) ...

    alert("Transmissão realizada!");
    carrinho = [];
    atualizarInterfaceCarrinho();
    toggleCarrinhoMobile(); // Fecha a gaveta após confirmar
    btn.innerText = "Confirmar Transmissão";
}
