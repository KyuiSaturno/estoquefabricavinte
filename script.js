// Mantenha aqui a sua URL do Apps Script gerada no último passo
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5wtsSda51rruXfp6k2vgu3Oj7FuP_uNJqnJypJ_ft8FC9OToInhlO7PmGF4XZbOij/exec";

// Variáveis globais do sistema
let usuarioLogado = "";
let dadosProdutosFiltrados = []; 
let carrinho = [];      
let indicesImagens = {}; 

// ==========================================
// CONTROLADOR DE NAVEGAÇÃO (ABAS ANIMADAS)
// ==========================================
function alternarAba(abaDestino) {
    const abaInicio = document.getElementById("aba-inicio");
    const abaProdutos = document.getElementById("aba-produtos");
    const btnInicio = document.getElementById("btn-aba-inicio");
    const btnProdutos = document.getElementById("btn-aba-produtos");

    if (abaDestino === 'inicio') {
        abaProdutos.classList.add("escondido");
        abaInicio.classList.remove("escondido");
        btnProdutos.classList.remove("ativa");
        btnInicio.classList.add("ativa");
    } else if (abaDestino === 'produtos') {
        abaInicio.classList.add("escondido");
        abaProdutos.classList.remove("escondido");
        btnInicio.classList.remove("ativa");
        btnProdutos.classList.add("ativa");
    }
}

// ==========================================
// INTERFACE DE LOGIN E CARREGAMENTO INICIAL
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
        params.append("dados", JSON.stringify({
            acao: "login",
            usuario: usuarioInput,
            senha: senhaInput
        }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            usuarioLogado = usuarioInput;
            document.getElementById("nome-operador").innerText = `Usuário: ${usuarioLogado}`;
            document.getElementById("tela-login").classList.add("escondido");
            document.getElementById("painel-principal").classList.remove("escondido");
            
            // Carrega os dados dinâmicos do Sheets em paralelo para melhor performance
            carregarMensagemBoasVindas();
            carregarCategoriasDinamicas();
        } else {
            erroLogin.innerText = resultado.erro || "Usuário ou senha incorretos.";
            btnLogin.innerText = "Entrar";
            btnLogin.disabled = false;
        }
    } catch (erro) {
        console.error("Erro no login:", erro);
        erroLogin.innerText = "Erro ao conectar com o servidor.";
        btnLogin.innerText = "Entrar";
        btnLogin.disabled = false;
    }
}

// ==========================================
// BUSCA DA FRASE DE BOAS VINDAS DO SHEETS
// ==========================================
async function carregarMensagemBoasVindas() {
    const caixaTexto = document.getElementById("texto-boas-vindas");
    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({ acao: "obterConfiguracoes" }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();
        if (resultado.sucesso) {
            caixaTexto.innerText = resultado.mensagemBoasVindas;
        } else {
            caixaTexto.innerText = "Bem-vindo de volta! Ótimo dia de trabalho.";
        }
    } catch (erro) {
        console.error("Erro ao carregar mensagem:", erro);
        caixaTexto.innerText = "Bem-vindo de volta! Ótimo dia de trabalho.";
    }
}

// ==========================================
// CONFIGURAÇÃO DO SELETOR DINÂMICO
// ==========================================
async function carregarCategoriasDinamicas() {
    const seletor = document.getElementById("filtro-categoria");
    if (!seletor) return;

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({ acao: "obterAbas" }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            seletor.innerHTML = '<option value="">-- Escolha uma Categoria --</option>';
            resultado.abas.forEach(aba => {
                const opcao = document.createElement("option");
                opcao.value = aba;
                opcao.innerText = aba;
                seletor.appendChild(opcao);
            });
            console.log("Categorias carregadas com sucesso:", resultado.abas);
        }
    } catch (erro) {
        console.error("Erro ao carregar categorias dinâmicas:", erro);
    }
}

// ==========================================
// FILTRAGEM E EXIBIÇÃO DE PRODUTOS
// ==========================================
async function filtrarPorCategoria() {
    const categoriaSelecionada = document.getElementById("filtro-categoria").value;
    const containerFiltrados = document.getElementById("lista-produtos-filtrados");

    if (!categoriaSelecionada) {
        containerFiltrados.innerHTML = '<p class="carrinho-vazio">Selecione uma categoria acima para listar os modelos correspondentes.</p>';
        return;
    }

    containerFiltrados.innerHTML = '<p class="carregando">Filtrando categoria no servidor...</p>';

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({
            acao: "obterProdutos",
            tipo: categoriaSelecionada
        }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            dadosProdutosFiltrados = resultado.produtos;
            renderizarProdutos(dadosProdutosFiltrados, "lista-produtos-filtrados", "produtos");
        } else {
            containerFiltrados.innerHTML = `<p class="erro">Erro ao buscar categoria: ${resultado.erro}</p>`;
        }
    } catch (erro) {
        console.error("Erro no filtro:", erro);
        containerFiltrados.innerHTML = '<p class="erro">Erro de rede ao buscar categoria.</p>';
    }
}

function renderizarProdutos(listaProdutos, containerId, prefixoContexto) {
    const listaDiv = document.getElementById(containerId);
    listaDiv.innerHTML = "";

    if (listaProdutos.length === 0) {
        listaDiv.innerHTML = "<p class='carrinho-vazio'>Nenhum modelo cadastrado nesta aba da planilha.</p>";
        return;
    }

    listaProdutos.forEach(produto => {
        const idUnicoControle = `${prefixoContexto}-${produto.id}`;
        
        if (indicesImagens[idUnicoControle] === undefined) {
            indicesImagens[idUnicoControle] = 0;
        }

        const coresDisponiveis = Object.keys(produto.estoquePorCor);
        const primeiraCor = coresDisponiveis[0] || "Padrão";
        const estoqueInicial = produto.estoquePorCor[primeiraCor] || 0;

        let imagensHTML = "";
        if (produto.imagens.length > 0) {
            produto.imagens.forEach((url, index) => {
                imagensHTML += `<img src="${url}" class="${index === 0 ? 'ativa' : ''}" data-index="${index}" alt="${produto.nome}">`;
            });
        } else {
            imagensHTML += `<img src="https://placehold.co/400x400?text=Sem+Foto" class="ativa" alt="Sem Foto">`;
        }

        let botoesCarrossel = "";
        if (produto.imagens.length > 1) {
            botoesCarrossel = `
                <button class="btn-carrossel btn-prev" onclick="mudarFoto('${idUnicoControle}', ${produto.imagens.length}, -1)">&#10094;</button>
                <button class="btn-carrossel btn-next" onclick="mudarFoto('${idUnicoControle}', ${produto.imagens.length}, 1)">&#10095;</button>
            `;
        }

        let coresOpcoes = "";
        coresDisponiveis.forEach(cor => {
            coresOpcoes += `<option value="${cor}">${cor}</option>`;
        });

        const cartao = document.createElement("div");
        cartao.className = "cartao-produto";
        cartao.innerHTML = `
            <div class="carrossel" id="carrossel-${idUnicoControle}">
                ${imagensHTML}
                ${botoesCarrossel}
            </div>
            <div class="info-produto">
                <h3>${produto.nome}</h3>
                <div class="seletor-grupo">
                    <label>Selecione a Cor / Tamanho:</label>
                    <select id="cor-${idUnicoControle}" onchange="atualizarStatusEstoque('${produto.id}', '${prefixoContexto}')">
                        ${coresOpcoes}
                    </select>
                </div>
                <p class="estoque-status ${estoqueInicial === 0 ? 'sem-estoque' : ''}" id="status-${idUnicoControle}">
                    Estoque disponível: <span>${estoqueInicial}</span> un.
                </p>
            </div>
            <button class="btn-adicionar" id="btn-add-${idUnicoControle}" onclick="adicionarAoCarrinho('${produto.id}', '${prefixoContexto}')" ${estoqueInicial === 0 ? 'disabled' : ''}>
                ${estoqueInicial === 0 ? 'Esgotado' : 'Selecionar Peça'}
            </button>
        `;
        listaDiv.appendChild(cartao);
    });
}

function mudarFoto(idUnicoControle, totalFotos, direcao) {
    let indexAtual = indicesImagens[idUnicoControle];
    indexAtual += direcao;

    if (indexAtual >= totalFotos) indexAtual = 0;
    if (indexAtual < 0) indexAtual = totalFotos - 1;

    indicesImagens[idUnicoControle] = indexAtual;

    const carrosselDiv = document.getElementById(`carrossel-${idUnicoControle}`);
    const imagens = carrosselDiv.querySelectorAll("img");
    
    imagens.forEach(img => img.classList.remove("ativa"));
    imagens[indexAtual].classList.add("ativa");
}

function atualizarStatusEstoque(produtoId, prefixoContexto) {
    const idUnicoControle = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => p.id === produtoId);
    
    const corSelecionada = document.getElementById(`cor-${idUnicoControle}`).value;
    const qtdDisponivel = produto.estoquePorCor[corSelecionada] || 0;

    const statusP = document.getElementById(`status-${idUnicoControle}`);
    const btnAdd = document.getElementById(`btn-add-${idUnicoControle}`);

    statusP.querySelector("span").innerText = qtdDisponivel;

    if (qtdDisponivel === 0) {
        statusP.classList.add("sem-estoque");
        btnAdd.innerText = "Esgotado";
        btnAdd.disabled = true;
    } else {
        statusP.classList.remove("sem-estoque");
        btnAdd.innerText = "Selecionar Peça";
        btnAdd.disabled = false;
    }
}

// ==========================================
// REGRAS DO CARRINHO DE TRANSMISSÃO
// ==========================================
function adicionarAoCarrinho(produtoId, prefixoContexto) {
    const idUnicoControle = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => p.id === produtoId);
    
    const corSelecionada = document.getElementById(`cor-${idUnicoControle}`).value;
    const estoqueMaximo = produto.estoquePorCor[corSelecionada] || 0;

    const itemExistente = carrinho.find(item => item.id === produtoId && item.corSelecionada === corSelecionada);

    if (itemExistente) {
        if (itemExistente.quantidade < estoqueMaximo) {
            itemExistente.quantidade++;
        } else {
            alert(`Fim do estoque físico para esta variação.`);
            return;
        }
    } else {
        carrinho.push({
            id: produtoId,
            nome: produto.nome,
            corSelecionada: corSelecionada,
            quantidade: 1,
            maximo: estoqueMaximo,
            categoriaOrigem: document.getElementById("filtro-categoria").value
        });
    }
    atualizarInterfaceCarrinho();
}

function改变QuantidadeCarrinho(index, alteracao) {
    const item = carrinho[index];
    const novaQtd = item.quantidade + alteracao;

    if (novaQtd <= 0) {
        carrinho.splice(index, 1);
    } else if (novaQtd <= item.maximo) {
        item.quantidade = novaQtd;
    } else {
        alert("A quantidade excede o estoque real disponível.");
    }
    atualizarInterfaceCarrinho();
}

function alterarQuantidadeCarrinho(index, alteracao) {
    const item = carrinho[index];
    const novaQtd = item.quantidade + alteracao;

    if (novaQtd <= 0) {
        carrinho.splice(index, 1);
    } else if (novaQtd <= item.maximo) {
        item.quantidade = novaQtd;
    } else {
        alert("A quantidade excede o estoque real disponível.");
    }
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const btnConfirmar = document.getElementById("btn-confirmar");

    if (carrinho.length === 0) {
        container.innerHTML = '<p class="carrinho-vazio">Nenhum item selecionado.</p>';
        btnConfirmar.disabled = true;
        return;
    }

    container.innerHTML = "";
    carrinho.forEach((item, index) => {
        const linha = document.createElement("div");
        linha.className = "item-carrinho-linha";
        linha.innerHTML = `
            <div>
                <strong>${item.nome}</strong><br>
                <small>${item.categoriaOrigem} (${item.corSelecionada})</small>
            </div>
            <div>
                <button onclick="alterarQuantidadeCarrinho(${index}, -1)">-</button>
                <span style="margin: 0 8px; font-weight: bold;">${item.quantidade}</span>
                <button onclick="alterarQuantidadeCarrinho(${index}, 1)">+</button>
            </div>
            <button class="btn-remover" onclick="alterarQuantidadeCarrinho(${index}, -${item.quantidade})">Excluir</button>
        `;
        container.appendChild(linha);
    });

    btnConfirmar.disabled = false;
}

async function confirmarBaixa() {
    const localizacao = document.getElementById("localizacao").value;
    const btnConfirmar = document.getElementById("btn-confirmar");

    if (carrinho.length === 0) return;
    if (!confirm(`Confirmar a retirada destes itens para: ${localizacao}?`)) return;

    btnConfirmar.innerText = "Processando...";
    btnConfirmar.disabled = true;

    try {
        for (let item of carrinho) {
            const params = new URLSearchParams();
            params.append("dados", JSON.stringify({
                acao: "darBaixa",
                tipo: item.categoriaOrigem,
                usuario: usuarioLogado,
                localizacao: localizacao,
                carrinho: [item]
            }));

            const resposta = await fetch(WEB_APP_URL, {
                method: "POST",
                body: params,
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });
            await resposta.json();
        }

        alert("Baixa processada com sucesso!");
        carrinho = [];
        atualizarInterfaceCarrinho();
        filtrarPorCategoria();

    } catch (erro) {
        console.error("Erro na baixa:", erro);
        alert("Erro crítico ao sincronizar os dados de saída.");
        btnConfirmar.innerText = "Confirmar Baixa no Estoque";
        btnConfirmar.disabled = false;
    }
}
