// Mantenha aqui a sua URL do Apps Script gerada no último passo
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5wtsSda51rruXfp6k2vgu3Oj7FuP_uNJqnJypJ_ft8FC9OToInhlO7PmGF4XZbOij/exec";

// Variáveis globais do sistema
let usuarioLogado = "";
let dadosProdutosFiltrados = []; 
let carrinho = [];      
let indicesImagens = {}; 

// ==========================================
// CONTROLADOR DE NAVEGAÇÃO INTERNA
// ==========================================
function alternarAba(abaDestino) {
    const abaProdutos = document.getElementById("aba-produtos");
    const btnProdutos = document.getElementById("btn-aba-produtos");

    // Mantido para compatibilidade caso o login acione a função, focando sempre no Catálogo
    if (abaDestino === 'produtos' || abaDestino === 'inicio') {
        if (abaProdutos) abaProdutos.classList.remove("escondido");
        if (btnProdutos) btnProdutos.classList.add("ativa");
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
            
            // Faz a troca de telas ocultando o login e revelando o painel
            document.getElementById("tela-login").classList.add("escondido");
            document.getElementById("painel-principal").classList.remove("escondido");
            
            // Força a aba do catálogo a ficar visualmente ativa por segurança
            alternarAba('produtos');
            
            // Carrega a listagem das abas/categorias vindas da Planilha
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

    containerFiltrados.innerHTML = '<p class="carrinho-vazio">Filtrando categoria no servidor...</p>';

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
            // Executa o filtro visual baseado no estado atual da caixinha promocional
            aplicarFiltroVisual();
        } else {
            containerFiltrados.innerHTML = `<p class="carrinho-vazio" style="color: var(--cor-erro);">Erro ao buscar categoria: ${resultado.erro}</p>`;
        }
    } catch (erro) {
        console.error("Erro no filtro:", erro);
        containerFiltrados.innerHTML = '<p class="carrinho-vazio" style="color: var(--cor-erro);">Erro de rede ao buscar categoria.</p>';
    }
}

// Executa a filtragem local sem precisar reconsultar o servidor
function aplicarFiltroVisual() {
    const filtroPromoCheckbox = document.getElementById("filtro-promocional");
    const apenasPromocionais = filtroPromoCheckbox ? filtroPromoCheckbox.checked : false;
    
    if (apenasPromocionais) {
        // Mantém apenas os modelos que contêm variação com estoque promocional maior que 0
        const produtosPromocionais = dadosProdutosFiltrados.filter(produto => {
            if (!produto.estoquePromocional) return false;
            return Object.values(produto.estoquePromocional).some(qtd => qtd > 0);
        });
        renderizarProdutos(produtosPromocionais, "lista-produtos-filtrados", "produtos", true);
    } else {
        renderizarProdutos(dadosProdutosFiltrados, "lista-produtos-filtrados", "produtos", false);
    }
}

function renderizarProdutos(listaProdutos, containerId, prefixoContexto, usarEstoquePromo = false) {
    const listaDiv = document.getElementById(containerId);
    listaDiv.innerHTML = "";

    if (listaProdutos.length === 0) {
        listaDiv.innerHTML = "<p class='carrinho-vazio'>Nenhum modelo cadastrado ou disponível para os filtros selecionados.</p>";
        return;
    }

    listaProdutos.forEach(produto => {
        const idUnicoControle = `${prefixoContexto}-${produto.id}`;
        
        if (indicesImagens[idUnicoControle] === undefined) {
            indicesImagens[idUnicoControle] = 0;
        }

        // Determina qual mapa de estoque ler
        const mapaEstoqueAlvo = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
        if (!mapaEstoqueAlvo) return;

        const coresTotais = Object.keys(mapaEstoqueAlvo);
        // Se estiver no modo promo, filtra no select para exibir apenas as cores que têm estoque promocional de fato
        const coresDisponiveis = usarEstoquePromo ? coresTotais.filter(cor => (mapaEstoqueAlvo[cor] || 0) > 0) : coresTotais;
        
        if (coresDisponiveis.length === 0) return;

        const primeiraCor = coresDisponiveis[0] || "Padrão";
        const estoqueInicial = mapaEstoqueAlvo[primeiraCor] || 0;

        let imagensHTML = "";
        if (produto.imagens && produto.imagens.length > 0) {
            produto.imagens.forEach((url, index) => {
                imagensHTML += `<img src="${url}" class="${index === 0 ? 'ativa' : ''}" data-index="${index}" alt="${produto.nome}">`;
            });
        } else {
            imagensHTML += `<img src="https://placehold.co/400x400?text=Sem+Foto" class="ativa" alt="Sem Foto">`;
        }

        let botoesCarrossel = "";
        if (produto.imagens && produto.imagens.length > 1) {
            botoesCarrossel = `
                <button class="btn-carrossel btn-prev" onclick="mudarFoto('${idUnicoControle}', ${produto.imagens.length}, -1)">&#10094;</button>
                <button class="btn-carrossel btn-next" onclick="mudarFoto('${idUnicoControle}', ${produto.imagens.length}, 1)">&#10095;</button>
            `;
        }

        let coresOpcoes = "";
        coresDisponiveis.forEach(cor => {
            coresOpcoes += `<option value="${cor}">${cor}</option>`;
        });

        // Adiciona um selo visual discreto de "PROMO" no topo do carrossel se a caixinha estiver ativa
        const tagPromoHTML = usarEstoquePromo ? `<div style="position: absolute; top: 10px; left: 10px; background-color: var(--cor-erro); color: white; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; z-index: 3; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">Promoção</div>` : '';

        const cartao = document.createElement("div");
        cartao.className = "cartao-produto";
        cartao.innerHTML = `
            <div class="carrossel" id="carrossel-${idUnicoControle}">
                ${tagPromoHTML}
                ${imagensHTML}
                ${botoesCarrossel}
            </div>
            <div class="info-produto">
                <h3>${produto.nome}</h3>
                <div class="seletor-grupo">
                    <label>Selecione a Cor / Tamanho:</label>
                    <select id="cor-${idUnicoControle}" onchange="atualizarStatusEstoque('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">
                        ${coresOpcoes}
                    </select>
                </div>
                <p class="estoque-status ${estoqueInicial === 0 ? 'sem-estoque' : ''}" id="status-${idUnicoControle}">
                    ${usarEstoquePromo ? 'Estoque Promo: ' : 'Estoque disponível: '}<span>${estoqueInicial}</span> un.
                </p>
            </div>
            <button class="btn-adicionar" id="btn-add-${idUnicoControle}" onclick="adicionarAoCarrinho('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})" ${estoqueInicial === 0 ? 'disabled' : ''}>
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

function atualizarStatusEstoque(produtoId, prefixoContexto, usarEstoquePromo = false) {
    const idUnicoControle = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => p.id === produtoId);
    if (!produto) return;
    
    const corSelecionada = document.getElementById(`cor-${idUnicoControle}`).value;
    const mapaEstoque = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
    const qtdDisponivel = mapaEstoque[corSelecionada] || 0;

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

    const urlImagemCor = produto.imagemPorCor ? produto.imagemPorCor[corSelecionada] : "";
    if (urlImagemCor) {
        const carrosselDiv = document.getElementById(`carrossel-${idUnicoControle}`);
        if (carrosselDiv) {
            const imagens = carrosselDiv.querySelectorAll("img");
            images.forEach((img, index) => {
                if (img.src === urlImagemCor || urlImagemCor.includes(img.getAttribute('src'))) {
                    images.forEach(i => i.classList.remove("ativa"));
                    img.classList.add("ativa");
                    indicesImagens[idUnicoControle] = index;
                }
            });
        }
    }
}

// ==========================================
// REGRAS INTERATIVAS DA GAVETA MOBILE
// ==========================================
function toggleCarrinhoMobile() {
    const carrinhoGaveta = document.getElementById("carrinho-gaveta");
    const labelStatus = document.getElementById("label-gaveta-status");
    
    if (carrinhoGaveta.classList.contains("aberto")) {
        carrinhoGaveta.classList.remove("aberto");
        // Força a atualização do texto do topo exibindo a contagem correta recolhida
        const totalUnidades = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
        labelStatus.innerText = totalUnidades === 0 ? "Carrinho Vazio 🛒" : `Ver Itens Selecionados (${totalUnidades} un.) 🔼`;
    } else {
        carrinhoGaveta.classList.add("aberto");
        labelStatus.innerText = "Fechar Carrinho 🔽";
    }
}

// ==========================================
// REGRAS DO CARRINHO DE TRANSMISSÃO
// ==========================================
function adicionarAoCarrinho(produtoId, prefixoContexto, usarEstoquePromo = false) {
    const idUnicoControle = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => p.id === produtoId);
    
    const corSelecionada = document.getElementById(`cor-${idUnicoControle}`).value;
    const mapaEstoque = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
    const estoqueMaximo = mapaEstoque[corSelecionada] || 0;

    const itemExistente = carrinho.find(item => item.id === produtoId && item.corSelecionada === corSelecionada && item.promocional === usarEstoquePromo);

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
            nome: produto.nome + (usarEstoquePromo ? " (PROMO)" : ""),
            corSelecionada: corSelecionada,
            quantidade: 1,
            maximo: estoqueMaximo,
            promocional: usarEstoquePromo,
            categoriaOrigem: document.getElementById("filtro-categoria").value
        });
    }
    
    // Força a abertura automática da gaveta se o usuário estiver operando em um celular
    if (window.innerWidth <= 850) {
        const carrinhoGaveta = document.getElementById("carrinho-gaveta");
        if (!carrinhoGaveta.classList.contains("aberto")) {
            toggleCarrinhoMobile();
        }
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
        alert(`A quantidade excede o estoque real disponível (${item.maximo} un.).`);
    }
    atualizarInterfaceCarrinho();
}

// Nova funcionalidade: Abre o campo input para digitação imediata ao clicar 2x
function habilitarEdicaoDireta(index) {
    const containerQtd = document.getElementById(`qtd-container-${index}`);
    const item = carrinho[index];
    
    containerQtd.innerHTML = `
        <input type="number" id="input-rapido-${index}" class="input-qtd-rapido" 
               value="${item.quantidade}" min="1" max="${item.maximo}"
               onblur="salvarQuantidadeDigitada(${index})" 
               onkeydown="if(event.key === 'Enter') salvarQuantidadeDigitada(${index})">
    `;
    
    const inputField = document.getElementById(`input-rapido-${index}`);
    inputField.focus();
    inputField.select(); // Deixa o número selecionado para apenas digitar o novo em cima
}

// Processa o valor numérico digitado em lote
function salvarQuantidadeDigitada(index) {
    const inputField = document.getElementById("input-rapido-" + index);
    if (!inputField) return;

    let valorDigitado = parseInt(inputField.value, 10);
    const item = carrinho[index];

    if (isNaN(valorDigitado) || valorDigitado <= 0) {
        carrinho.splice(index, 1); // Exclui caso apague tudo ou deixe zerado
    } else if (valorDigitado <= item.maximo) {
        item.quantidade = valorDigitado;
    } else {
        alert(`Quantidade indisponível! Ajustado para o limite máximo de estoque (${item.maximo} un.).`);
        item.quantidade = item.maximo;
    }
    
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const btnConfirmar = document.getElementById("btn-confirmar");
    const badgeContador = document.getElementById("badge-contador-carrinho");
    const labelStatus = document.getElementById("label-gaveta-status");

    const totalUnidadesFisicas = carrinho.reduce((soma, item) => soma + item.quantidade, 0);

    if (badgeContador) badgeContador.innerText = totalUnidadesFisicas;

    if (carrinho.length === 0) {
        container.innerHTML = '<p class="carrinho-vazio">Nenhum item selecionado.</p>';
        btnConfirmar.disabled = true;
        if (labelStatus) labelStatus.innerText = "Carrinho Vazio 🛒";
        
        // Se o carrinho esvaziar completamente no mobile, recolhe por estética
        document.getElementById("carrinho-gaveta").classList.remove("aberto");
        return;
    }

    if (labelStatus && !document.getElementById("carrinho-gaveta").classList.contains("aberto")) {
        labelStatus.innerText = `Ver Itens Selecionados (${totalUnidadesFisicas} un.) 🔼`;
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
            <div style="display:flex; align-items:center; gap:5px;" id="qtd-container-${index}">
                <button onclick="alterarQuantidadeCarrinho(${index}, -1)">-</button>
                <span style="font-weight: bold; min-width:30px; text-align:center; cursor: pointer; user-select:none;" 
                      title="Clique duas vezes para digitar" 
                      ondblclick="habilitarEdicaoDireta(${index})">${item.quantidade}</span>
                <button onclick="alterarQuantidadeCarrinho(${index}, 1)">+</button>
            </div>
            <button style="background-color: #ff4d4d; color: white;" onclick="alterarQuantidadeCarrinho(${index}, -${item.quantidade})">Excluir</button>
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
                isPromo: item.promocional, 
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
        btnConfirmar.innerText = "Confirmar";
        btnConfirmar.disabled = false;
    }
}
