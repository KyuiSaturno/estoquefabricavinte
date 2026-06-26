// URL do seu Google Apps Script Web App
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5wtsSda51rruXfp6k2vgu3Oj7FuP_uNJqnJypJ_ft8FC9OToInhlO7PmGF4XZbOij/exec";

// Variáveis globais do sistema
const TIPO_PRODUTO = "Ecobags";
let usuarioLogado = "";
let dadosProdutos = []; // Guarda o estoque vindo do Sheets
let carrinho = [];      // Itens selecionados para baixa
let indicesImagens = {}; // Controla qual foto do carrossel está ativa por modelo

// ==========================================
// 1. SISTEMA DE LOGIN (PRIVACIDADE)
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
        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify({
                acao: "login",
                usuario: usuarioInput,
                senha: senhaInput
            })
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            usuarioLogado = usuarioInput;
            document.getElementById("nome-operador").innerText = `Usuário: ${usuarioLogado}`;
            document.getElementById("tela-login").classList.add("escondido");
            document.getElementById("painel-principal").classList.remove("escondido");
            
            // Login feito com sucesso, agora carrega o estoque
            carregarEstoque();
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
// 2. BUSCAR E EXIBIR ESTOQUE
// ==========================================
async function carregarEstoque() {
    const listaDiv = document.getElementById("lista-produtos");
    listaDiv.innerHTML = '<p class="carregando">Buscando modelos atualizados...</p>';

    try {
        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify({
                acao: "obterProdutos",
                tipo: TIPO_PRODUTO
            })
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            dadosProdutos = resultado.produtos;
            renderizarProdutos();
        } else {
            listaDiv.innerHTML = `<p class="erro">Erro ao carregar estoque: ${resultado.erro}</p>`;
        }
    } catch (erro) {
        console.error("Erro ao obter estoque:", erro);
        listaDiv.innerHTML = '<p class="erro">Erro de conexão ao buscar o estoque.</p>';
    }
}

function renderizarProdutos() {
    const listaDiv = document.getElementById("lista-produtos");
    listaDiv.innerHTML = "";

    if (dadosProdutos.length === 0) {
        listaDiv.innerHTML = "<p>Nenhum modelo de Ecobag cadastrado no estoque.</p>";
        return;
    }

    dadosProdutos.forEach(produto => {
        // Inicializa o controle do carrossel para este produto se não existir
        if (indicesImagens[produto.id] === undefined) {
            indicesImagens[produto.id] = 0;
        }

        const coresDisponiveis = Object.keys(produto.estoquePorCor);
        const primeiraCor = coresDisponiveis[0] || "Padrão";
        const estoqueInicial = produto.estoquePorCor[primeiraCor] || 0;

        // Monta o HTML das imagens do Carrossel
        let imagensHTML = "";
        if (produto.imagens.length > 0) {
            produto.imagens.forEach((url, index) => {
                imagensHTML += `<img src="${url}" class="${index === 0 ? 'ativa' : ''}" data-index="${index}" alt="${produto.nome}">`;
            });
        } else {
            // Imagem padrão caso o link esteja em branco na planilha
            imagensHTML += `<img src="https://placehold.co/400x400?text=Sem+Foto" class="ativa" alt="Sem Foto">`;
        }

        // Se tiver mais de uma imagem, adiciona os botões de seta do carrossel
        let botoesCarrossel = "";
        if (produto.imagens.length > 1) {
            botoesCarrossel = `
                <button class="btn-carrossel btn-prev" onclick="mudarFoto('${produto.id}', -1)">&#10094;</button>
                <button class="btn-carrossel btn-next" onclick="mudarFoto('${produto.id}', 1)">&#10095;</button>
            `;
        }

        // Opções da caixinha de seleção de cores
        let coresOpcoes = "";
        coresDisponiveis.forEach(cor => {
            coresOpcoes += `<option value="${cor}">${cor}</option>`;
        });

        // Montagem final do cartão do modelo
        const cartao = document.createElement("div");
        cartao.className = "cartao-produto";
        cartao.innerHTML = `
            <div class="carrossel" id="carrossel-${produto.id}">
                ${imagensHTML}
                ${botoesCarrossel}
            </div>
            <div class="info-produto">
                <h3>${produto.nome}</h3>
                
                <div class="seletor-grupo">
                    <label>Selecione a Cor:</label>
                    <select id="cor-${produto.id}" onchange="atualizarStatusEstoque('${produto.id}')">
                        ${coresOpcoes}
                    </select>
                </div>

                <p class="estoque-status ${estoqueInicial === 0 ? 'sem-estoque' : ''}" id="status-${produto.id}">
                    Estoque disponível: <span>${estoqueInicial}</span> un.
                </p>
            </div>
            <button class="btn-adicionar" id="btn-add-${produto.id}" onclick="adicionarAoCarrinho('${produto.id}')" ${estoqueInicial === 0 ? 'disabled' : ''}>
                ${estoqueInicial === 0 ? 'Esgotado' : 'Selecionar Peça'}
            </button>
        `;
        listaDiv.appendChild(cartao);
    });
}

// ==========================================
// 3. CONTROLE DO CARROSSEL DE FOTOS
// ==========================================
function mudarFoto(produtoId, direcao) {
    const produto = dadosProdutos.find(p => p.id === produtoId);
    if (!produto) return;

    let indexAtual = indicesImagens[produtoId];
    indexAtual += direcao;

    if (indexAtual >= produto.imagens.length) indexAtual = 0;
    if (indexAtual < 0) indexAtual = produto.imagens.length - 1;

    indicesImagens[produtoId] = indexAtual;

    const carrosselDiv = document.getElementById(`carrossel-${produtoId}`);
    const imagens = carrosselDiv.querySelectorAll("img");
    
    imagens.forEach(img => img.classList.remove("ativa"));
    imagens[indexAtual].classList.add("ativa");
}

// Atualiza o texto do estoque na tela quando o usuário muda a cor selecionada
function atualizarStatusEstoque(produtoId) {
    const produto = dadosProdutos.find(p => p.id === produtoId);
    const corSelecionada = document.getElementById(`cor-${produtoId}`).value;
    const qtdDisponivel = produto.estoquePorCor[corSelecionada] || 0;

    const statusP = document.getElementById(`status-${produtoId}`);
    const btnAdd = document.getElementById(`btn-add-${produtoId}`);

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
// 4. GERENCIAMENTO DO CARRINHO DE BAIXAS
// ==========================================
function adicionarAoCarrinho(produtoId) {
    const produto = dadosProdutos.find(p => p.id === produtoId);
    const corSelecionada = document.getElementById(`cor-${produtoId}`).value;
    const estoqueMaximo = produto.estoquePorCor[corSelecionada] || 0;

    // Procura se já existe exatamente esse modelo nessa cor no carrinho
    const itemExistente = carrinho.find(item => item.id === produtoId && item.corSelecionada === corSelecionada);

    if (itemExistente) {
        if (itemExistente.quantidade < estoqueMaximo) {
            itemExistente.quantidade++;
        } else {
            alert(`Limite de estoque atingido para o Modelo #${produtoId} na cor ${corSelecionada}.`);
            return;
        }
    } else {
        carrinho.push({
            id: produtoId,
            nome: produto.nome,
            corSelecionada: corSelecionada,
            quantidade: 1,
            maximo: estoqueMaximo
        });
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
        alert("Quantidade solicitada excede o estoque físico disponível.");
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
                <small>Cor: ${item.corSelecionada}</small>
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

// ==========================================
// 5. ENVIAR BAIXA PARA O GOOGLE SHEETS
// ==========================================
async function confirmarBaixa() {
    const localizacao = document.getElementById("localizacao").value;
    const btnConfirmar = document.getElementById("btn-confirmar");

    if (carrinho.length === 0) return;

    if (!confirm(`Confirmar a retirada destes itens para: ${localizacao}?`)) {
        return;
    }

    btnConfirmar.innerText = "Processando Baixa...";
    btnConfirmar.disabled = true;

    try {
        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify({
                acao: "darBaixa",
                tipo: TIPO_PRODUTO,
                usuario: usuarioLogado,
                localizacao: localizacao,
                carrinho: carrinho
            })
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            alert("Baixa realizada com sucesso! Planilha atualizada.");
            carrinho = []; // Limpa o carrinho
            atualizarInterfaceCarrinho();
            // Atualiza a vitrine com as novas quantidades do estoque
            await carregarEstoque();
        } else {
            alert(`Erro ao processar baixa: ${resultado.erro}`);
            btnConfirmar.innerText = "Confirmar Baixa no Estoque";
            btnConfirmar.disabled = false;
        }
    } catch (erro) {
        console.error("Erro ao enviar baixa:", erro);
        alert("Erro crítico de rede ao enviar dados para a planilha.");
        btnConfirmar.innerText = "Confirmar Baixa no Estoque";
        btnConfirmar.disabled = false;
    }
}
