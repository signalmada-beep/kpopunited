// ========== src/pages/Terms.tsx ==========
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Terms.css';

const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="terms-page">
      <div className="terms-container">
        {/* HEADER */}
        <div className="terms-header">
          <button className="terms-back" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left" />
          </button>
          <h1 className="terms-title">
            <i className="fas fa-file-contract" />
            Conditions d'utilisation
          </h1>
        </div>

        {/* CONTENU */}
        <div className="terms-content">
          <div className="terms-section">
            <h2>1. Acceptation des conditions</h2>
            <p>
              En utilisant K-POP UNITED, vous acceptez pleinement les présentes 
              conditions d'utilisation. Si vous n'acceptez pas ces conditions, 
              veuillez ne pas utiliser notre plateforme.
            </p>
          </div>

          <div className="terms-section">
            <h2>2. Description du service</h2>
            <p>
              K-POP UNITED est une plateforme sociale dédiée aux fans de K-Pop 
              du monde entier. Elle permet aux utilisateurs de :
            </p>
            <ul>
              <li>Créer et partager des publications</li>
              <li>Interagir avec d'autres fans</li>
              <li>Participer à des événements communautaires</li>
              <li>Découvrir des artistes et des groupes K-Pop</li>
              <li>Partager des photos et des vidéos</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>3. Compte utilisateur</h2>
            <p>
              Pour utiliser certaines fonctionnalités, vous devez créer un compte. 
              Vous êtes responsable de :
            </p>
            <ul>
              <li>La confidentialité de vos identifiants de connexion</li>
              <li>Toutes les activités effectuées sous votre compte</li>
              <li>La véracité des informations fournies</li>
              <li>La mise à jour de vos informations personnelles</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>4. Contenu utilisateur</h2>
            <p>
              Vous conservez tous vos droits sur le contenu que vous publiez. 
              En publiant, vous accordez à K-POP UNITED une licence mondiale, 
              non exclusive et libre de droits pour :
            </p>
            <ul>
              <li>Afficher, distribuer et promouvoir votre contenu</li>
              <li>Adapter et modifier pour les besoins de la plateforme</li>
              <li>Utiliser à des fins promotionnelles</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>5. Comportement interdit</h2>
            <p>
              Il est interdit de publier ou de partager du contenu :
            </p>
            <ul>
              <li>Violent, haineux ou discriminatoire</li>
              <li>Sexuellement explicite ou inapproprié</li>
              <li>Portant atteinte aux droits d'autrui</li>
              <li>Contenant des virus ou des logiciels malveillants</li>
              <li>Constituant du spam ou de la publicité non sollicitée</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>6. Propriété intellectuelle</h2>
            <p>
              Tous les droits de propriété intellectuelle sur la plateforme 
              K-POP UNITED appartiennent à leurs propriétaires respectifs. 
              Vous vous engagez à ne pas :
            </p>
            <ul>
              <li>Copier ou reproduire du contenu sans autorisation</li>
              <li>Utiliser des marques déposées sans consentement</li>
              <li>Distribuer du contenu protégé par le droit d'auteur</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>7. Résiliation</h2>
            <p>
              Nous nous réservons le droit de suspendre ou de résilier votre 
              compte à tout moment, avec ou sans préavis, en cas de :
            </p>
            <ul>
              <li>Violation des présentes conditions</li>
              <li>Comportement inapproprié</li>
              <li>Demande légale ou réglementaire</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>8. Modifications</h2>
            <p>
              Nous pouvons modifier ces conditions à tout moment. Les 
              modifications seront publiées sur cette page et prendront 
              effet immédiatement. Nous vous encourageons à consulter 
              régulièrement cette page.
            </p>
          </div>

          <div className="terms-section">
            <h2>9. Contact</h2>
            <p>
              Pour toute question concernant ces conditions, veuillez nous 
              contacter à : <a href="mailto:support@kpop-united.com">support@kpop-united.com</a>
            </p>
          </div>

          <div className="terms-footer">
            <p>Dernière mise à jour : 25 juillet 2026</p>
            <p>© 2026 K-POP UNITED. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;